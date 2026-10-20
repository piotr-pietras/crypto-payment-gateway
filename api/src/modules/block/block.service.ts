import { Injectable, OnModuleInit } from '@nestjs/common';
import { EtherscanService } from '../etherscan/etherscan.service';
import { Cron } from '@nestjs/schedule';
import { DbService } from '../db/db.service';
import { Mutex } from 'async-mutex';
import { AccountService } from '../account/account.service';
import { PaymentService } from '../payment/payment.service';
import {
  ERC20TransferABI,
  ERC20TransferFromFuncName,
  ERC20TransferFuncName,
  PaymentTokenAddresses,
} from 'src/types';
import { ConfigService } from '@nestjs/config';
import { EnvironmentVariables } from '../env/env.validation';
import { Interface } from 'ethers';

@Injectable()
export class BlockService implements OnModuleInit {
  /**
   * @description Timestamp of the last block check
   */
  private lastBlockCheckTimestamp = 0;
  /**
   * @description Next block to process
   */
  private blockCursor = BigInt(0);
  /**
   * @description Offset prevents etherscan API initialization lag
   */
  private readonly blockCursorOffset = BigInt(10);
  /**
   * @description Minus from the block interval to prevent stacking in the loop
   */
  private readonly blockIntervalPoke = 2000;
  private readonly mutex = new Mutex();

  constructor(
    private readonly env: ConfigService<
      Record<keyof EnvironmentVariables, string>,
      true
    >,
    private readonly db: DbService,
    private readonly account: AccountService,
    private readonly etherscan: EtherscanService,
    private readonly payment: PaymentService,
  ) {}

  async onModuleInit() {
    const init = await this.db.init.findUnique({
      where: {
        id: 0,
      },
    });
    if (!init) {
      throw new Error('App has not been initialized correctly');
    }

    this.blockCursor = init.lastBlockNumber + 1n - this.blockCursorOffset;
    console.log(`Starting block cursor at ${this.blockCursor}`);
  }

  /**
   * Checking for transfer in the newest block and sync database
   *
   * @description This is the main function that checks for transfer in the newest block.
   * It is much faster way then @see syncBlocks function.
   */
  @Cron('*/1 * * * * *', {
    name: 'syncNewestBlock',
  })
  async syncNewestBlock() {
    const blockInterval = this.env.get('ETH_BLOCK_INTERVAL');
    if (
      Date.now() - this.lastBlockCheckTimestamp <
      blockInterval - this.blockIntervalPoke
    )
      return;
    if (await this.mutex.isLocked()) return;

    await this.mutex.acquire();

    try {
      const currentBlockNumber = BigInt(await this.etherscan.getBlockNumber());

      if (currentBlockNumber < this.blockCursor) return;

      const blocksToCheck = currentBlockNumber - this.blockCursor + 1n;
      if (blocksToCheck > 1n) {
        console.log(
          `Checking blocks from ${this.blockCursor} to ${currentBlockNumber} (${blocksToCheck} blocks)`,
        );
      } else {
        console.log(`Checking block ${currentBlockNumber}`);
      }

      for (
        let blockNumber = this.blockCursor;
        blockNumber <= currentBlockNumber;
        blockNumber++
      ) {
        const block = await this.etherscan.getBlockByNumber(blockNumber);

        for (const tx of block.transactions) {
          if (this.isToAddressPaymentToken(tx.to)) {
            const parsed = await this.parseERC20TransferArgs(tx);

            // If transaction is not a valid ERC20 transfer, skip it
            if (!parsed) continue;

            if (
              (parsed.funcName === ERC20TransferFuncName ||
                parsed.funcName === ERC20TransferFromFuncName) &&
              parsed.toAddress === this.account.root.address.toLowerCase()
            ) {
              const exists = await this.db.transfer.findUnique({
                where: {
                  hash: tx.hash,
                },
              });

              // If transfer already exists, skip it
              if (exists) continue;

              const receipt = await this.etherscan.getTransactionReceipt(
                tx.hash,
              );

              // If transaction is reverted, skip it
              if (receipt?.status === '0x0') continue;

              await this.db.transfer.create({
                data: {
                  hash: tx.hash,
                  blockNumber: BigInt(tx.blockNumber),
                  value: BigInt(parsed.value),
                  contractAddress: tx.to.toLowerCase(),
                  fromAddress: parsed.fromAddress.toLowerCase(),
                },
              });
              await this.payment.linkPayment(tx.hash);
            }
          }
        }
      }

      this.lastBlockCheckTimestamp = Date.now();
      this.blockCursor = currentBlockNumber + 1n;
    } finally {
      this.mutex.release();
    }
  }

  /**
   * Syncing transaction database with the blockchain
   *
   * @description This is additional safety mechanism to ensure that the database is synced with the blockchain
   * It is slower because of etherscan indexing lag, but much more reliable.
   */
  // @Cron('*/15 * * * * *', {
  //   name: 'syncHistoryBlocks',
  // })
  // async syncHistoryBlocks() {
  //   if (await this.mutex.isLocked()) return;

  //   await this.mutex.acquire();

  //   try {
  //     const init = await this.db.init.findUnique({
  //       where: {
  //         id: 0,
  //       },
  //     });

  //     if (!init) {
  //       throw new Error('App has not been initialized correctly');
  //     }

  //     const currentBlockNumber = await this.etherscan.getBlockNumber();

  //     console.log(
  //       `Checking for new transactions from ${init.lastBlockNumber - BigInt(10)} to ${BigInt(currentBlockNumber)}`,
  //     );
  //     const txs = await this.etherscan.getERC20TokenTransfer({
  //       address: this.account.root.address,
  //       // Read small window of blocks to avoid missing any transactions
  //       startblock: init.lastBlockNumber - BigInt(10),
  //       endblock: currentBlockNumber,
  //     });

  //     await this.db.transfer.createMany({
  //       data: txs.map((tx) => ({
  //         hash: tx.hash,
  //         blockNumber: BigInt(tx.blockNumber),
  //         value: BigInt(tx.value),
  //         contractAddress: tx.contractAddress.toLowerCase(),
  //         fromAddress: tx.from.toLowerCase(),
  //       })),
  //       skipDuplicates: true,
  //     });

  //     for (const tx of txs) {
  //       await this.payment.linkPayment(tx.hash);
  //     }

  //     await this.db.init.update({
  //       where: {
  //         id: 0,
  //       },
  //       data: {
  //         lastBlockNumber: BigInt(currentBlockNumber),
  //       },
  //     });
  //   } finally {
  //     this.mutex.release();
  //   }
  // }

  private async parseERC20TransferArgs(
    tx: Awaited<
      ReturnType<typeof this.etherscan.getBlockByNumber>
    >['transactions'][number],
  ) {
    const iface = new Interface(ERC20TransferABI);
    const decodedTx = iface.parseTransaction({
      data: tx.input,
      value: tx.value,
    });

    switch (decodedTx?.name) {
      case ERC20TransferFuncName:
        return {
          funcName: ERC20TransferFuncName,
          fromAddress: tx.from.toLowerCase(),
          toAddress: decodedTx?.args?.[0]?.toLowerCase(),
          value: decodedTx?.args?.[1],
        };
      case ERC20TransferFromFuncName:
        return {
          funcName: ERC20TransferFromFuncName,
          fromAddress: decodedTx?.args?.[0]?.toLowerCase(),
          toAddress: decodedTx?.args?.[1]?.toLowerCase(),
          value: decodedTx?.args[2],
        };
      default:
        return null;
    }
  }

  private isToAddressPaymentToken(toAddress: string) {
    const env = this.env.get('ENV');
    return Object.keys(PaymentTokenAddresses).some((token) => {
      return (
        PaymentTokenAddresses[token][env].toLowerCase() ===
        toAddress?.toLowerCase()
      );
    });
  }

  async getTransfers(address: string) {
    const transfers = await this.db.transfer.findMany({
      where: {
        fromAddress: address.toLowerCase(),
      },
    });
    return transfers.map((transfer) => ({
      ...transfer,
      blockNumber: transfer.blockNumber.toString(),
      value: transfer.value.toString(),
    }));
  }
}
