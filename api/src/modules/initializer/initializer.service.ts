import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash } from 'crypto';
import { AccountService } from '../account/account.service';
import { DbService } from '../db/db.service';
import { EnvironmentVariables } from '../env/env.validation';
import { EtherscanService } from '../etherscan/etherscan.service';
import { PaymentService } from '../payment/payment.service';

@Injectable()
export class InitializerService implements OnModuleInit {
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
    const phraseHash = createHash('sha256')
      .update(this.env.get('PHRASE'))
      .digest('hex');

    let init = await this.db.init.findUnique({
      where: {
        id: 0,
      },
    });

    // Prevent re-initialization database with a different account
    if (init && init?.phraseHash !== phraseHash) {
      throw new Error(
        '\n' +
          'It looks like database was initialized with a different Ethereum account (different mnemonic phrase)' +
          'If it was intentional please clear database to make it initialized with the current account' +
          '\n',
      );
    }

    const currentBlockNumber = await this.etherscan.getBlockNumber();

    if (!init) {
      init = await this.db.init.create({
        data: {
          id: 0,
          phraseHash,
          lastBlockNumber: BigInt(currentBlockNumber),
        },
      });
    }

    const batchSize = this.env.get<number>('INIT_TX_SYNC_BLOCK_BATCH_SIZE');
    const backward = this.env.get<number>(
      'INIT_BACKWARD_TX_SYNC_BLOCK_QUANTITY',
    );
    const remainingBlocks =
      BigInt(currentBlockNumber) - init.lastBlockNumber + BigInt(backward);

    // BigInt `/` truncates; ceiling divide: (a + b - 1n) / b
    const batchesToProcess = Number(
      (remainingBlocks + BigInt(batchSize) - 1n) / BigInt(batchSize),
    );

    console.log(`Syncing with ${batchesToProcess} missing batches...`);

    for (let i = 0; i < batchesToProcess; i++) {
      const startBlockNumber =
        Number(init.lastBlockNumber) - backward + i * batchSize;
      const endBlockNumber = startBlockNumber + batchSize;

      console.log(`Syncing from ${startBlockNumber} to ${endBlockNumber}`);

      const txs = await this.etherscan.getERC20TokenTransfer({
        address: this.account.root.address,
        startblock: startBlockNumber,
        endblock: endBlockNumber,
      });

      await this.db.transfer.createMany({
        data: txs.map((tx) => ({
          hash: tx.hash,
          blockNumber: BigInt(tx.blockNumber),
          value: BigInt(tx.value),
          contractAddress: tx.contractAddress.toLowerCase(),
          fromAddress: tx.from.toLowerCase(),
        })),
        skipDuplicates: true,
      });
      console.log(`Synced ${i + 1} of ${batchesToProcess} batches`);

      for (const tx of txs) {
        await this.payment.linkPayment(tx.hash);
      }
    }

    await this.db.init.update({
      where: {
        id: 0,
      },
      data: {
        lastBlockNumber: BigInt(currentBlockNumber),
      },
    });
  }
}
