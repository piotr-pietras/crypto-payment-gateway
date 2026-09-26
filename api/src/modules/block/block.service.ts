import { Injectable } from '@nestjs/common';
import { EtherscanService } from '../etherscan/etherscan.service';
import { Cron } from '@nestjs/schedule';
import { DbService } from '../db/db.service';
import { Mutex } from 'async-mutex';
import { AccountService } from '../account/account.service';
import { PaymentService } from '../payment/payment.service';
import { ERC20TransferABI } from 'src/types';
import { isToAddressPaymentToken } from 'src/common/utils/isToAddressPaymentToken';
import { ConfigService } from '@nestjs/config';
import { EnvironmentVariables } from '../env/env.validation';
import { Interface } from 'ethers';
import { WSGateway } from '../ws/ws.gateway';

@Injectable()
export class BlockService {
  private lastBlockCheckTimestamp = 0;
  private lastBlockCheckNumber = BigInt(0);
  private readonly blockIntervalPoke = 2000;
  private readonly mutex = new Mutex();

  constructor(
    private readonly env: ConfigService<
      Record<keyof EnvironmentVariables, string>,
      true
    >,
    private readonly db: DbService,
    private readonly ws: WSGateway,
    private readonly account: AccountService,
    private readonly etherscan: EtherscanService,
    private readonly payment: PaymentService,
  ) {}

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
      const currentBlockNumber = await this.etherscan.getBlockNumber();

      if (BigInt(currentBlockNumber) <= this.lastBlockCheckNumber) return;

      const block = await this.etherscan.getBlockByNumber(
        BigInt(currentBlockNumber),
      );

      for (const tx of block.transactions) {
        if (isToAddressPaymentToken(tx.to, this.env.get('ENV'))) {
          const iface = new Interface(ERC20TransferABI);
          const decodedTx = iface.parseTransaction({
            data: tx.input,
            value: tx.value,
          });
          const funcName = decodedTx?.fragment.name;
          const toAddress = decodedTx?.args[0];
          const amount = decodedTx?.args[1];
          if (
            funcName === 'transfer' &&
            toAddress === this.account.root.address
          ) {
            const exists = await this.db.transfer.findUnique({
              where: {
                hash: tx.hash,
              },
            });
            if (exists) return;

            await this.db.transfer.create({
              data: {
                hash: tx.hash,
                blockNumber: BigInt(tx.blockNumber),
                amount: BigInt(amount),
                contractAddress: tx.to,
                fromAddress: tx.from,
              },
            });
            await this.payment.linkPayment(tx.hash);
          }
        }
      }

      this.lastBlockCheckTimestamp = Date.now();
      this.lastBlockCheckNumber = BigInt(currentBlockNumber);
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
  @Cron('*/15 * * * * *', {
    name: 'syncHistoryBlocks',
  })
  async syncHistoryBlocks() {
    if (await this.mutex.isLocked()) return;

    await this.mutex.acquire();

    try {
      const init = await this.db.init.findUnique({
        where: {
          id: 0,
        },
      });

      if (!init) {
        throw new Error('App has not been initialized correctly');
      }

      const currentBlockNumber = await this.etherscan.getBlockNumber();

      console.log(
        `Checking for new transactions from ${init.lastBlockNumber - BigInt(10)} to ${BigInt(currentBlockNumber)}`,
      );
      const txs = (
        await this.etherscan.getERC20TokenTransfer({
          address: this.account.root.address,
          // Read small window of blocks to avoid missing any transactions
          startblock: init.lastBlockNumber - BigInt(10),
          endblock: currentBlockNumber,
        })
      ).filter(
        (tx) => tx.functionName === 'transfer(address to, uint256 amount)',
      );

      await this.db.transfer.createMany({
        data: txs.map((tx) => ({
          hash: tx.hash,
          blockNumber: BigInt(tx.blockNumber),
          amount: BigInt(tx.value),
          contractAddress: tx.contractAddress,
          fromAddress: tx.from,
        })),
        skipDuplicates: true,
      });

      for (const tx of txs) {
        await this.payment.linkPayment(tx.hash);
      }

      await this.db.init.update({
        where: {
          id: 0,
        },
        data: {
          lastBlockNumber: BigInt(currentBlockNumber),
        },
      });
    } finally {
      this.mutex.release();
    }
  }
}
