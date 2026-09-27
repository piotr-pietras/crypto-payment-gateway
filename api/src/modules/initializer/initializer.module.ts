import { Module } from '@nestjs/common';
import { AccountModule } from '../account/account.module';
import { InitializerService } from './initializer.service';
import { DbModule } from '../db/db.module';
import { ConfigService } from '@nestjs/config';
import { AccountService } from '../account/account.service';
import { DbService } from '../db/db.service';
import { EnvironmentVariables } from '../env/env.validation';
import { createHash } from 'crypto';
import { EtherscanModule } from '../etherscan/etherscan.module';
import { EtherscanService } from '../etherscan/etherscan.service';

@Module({
  imports: [DbModule, AccountModule, EtherscanModule],
  controllers: [],
  providers: [
    {
      provide: InitializerService,
      useFactory: async (
        env: ConfigService<Record<keyof EnvironmentVariables, string>, true>,
        db: DbService,
        account: AccountService,
        etherscan: EtherscanService,
      ) => {
        const phraseHash = createHash('sha256')
          .update(env.get('PHRASE'))
          .digest('hex');

        let init = await db.init.findUnique({
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
        } else {
          const currentBlockNumber = await etherscan.getBlockNumber();

          if (!init) {
            init = await db.init.create({
              data: {
                id: 0,
                phraseHash,
                lastBlockNumber: BigInt(currentBlockNumber),
              },
            });
          }

          const batchSize = env.get<number>('INIT_TX_SYNC_BLOCK_BATCH_SIZE');
          const backward = env.get<number>(
            'INIT_BACKWARD_TX_SYNC_BLOCK_QUANTITY',
          );
          const remainingBlocks =
            BigInt(currentBlockNumber) -
            init!.lastBlockNumber +
            BigInt(backward);

          // BigInt `/` truncates; ceiling divide: (a + b - 1n) / b
          const batchesToProcess = Number(
            (remainingBlocks + BigInt(batchSize) - 1n) / BigInt(batchSize),
          );

          console.log(`Syncing with ${batchesToProcess} missing batches...`);

          for (let i = 0; i < batchesToProcess; i++) {
            const startBlockNumber =
              Number(init!.lastBlockNumber) - backward + i * batchSize;
            const endBlockNumber = startBlockNumber + batchSize;

            console.log(
              `Syncing from ${startBlockNumber} to ${endBlockNumber}`,
            );

            const txs = await etherscan.getERC20TokenTransfer({
              address: account.root.address,
              startblock: startBlockNumber,
              endblock: endBlockNumber,
            });

            await db.transfer.createMany({
              data: txs.map((tx) => ({
                hash: tx.hash,
                contractAddress: tx.contractAddress,
                tokenSymbol: tx.tokenSymbol,
                blockNumber: BigInt(tx.blockNumber),
                value: BigInt(tx.value),
                fromAddress: tx.from,
              })),
              skipDuplicates: true,
            });
            console.log(`Synced ${i + 1} of ${batchesToProcess} batches`);
          }

          await db.init.upsert({
            where: {
              id: 0,
            },
            update: {
              phraseHash,
              lastBlockNumber: BigInt(currentBlockNumber),
            },
            create: {
              id: 0,
              phraseHash,
              lastBlockNumber: BigInt(currentBlockNumber),
            },
          });
        }

        return new InitializerService();
      },
      inject: [ConfigService, DbService, AccountService, EtherscanService],
    },
  ],
  exports: [InitializerService],
})
export class InitializerModule {}
