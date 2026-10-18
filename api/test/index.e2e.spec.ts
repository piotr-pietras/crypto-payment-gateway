import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { DbService } from './../src/modules/db/db.service';
import e2eUtils from './e2e.utils';
import { Contract, JsonRpcProvider, Wallet } from 'ethers';
import { AccountService } from './../src/modules/account/account.service';
import {
  ChainId,
  Environment,
  PaymentTokenAddresses,
  PaymentTokens,
} from 'src/types';
import { PaymentService } from 'src/modules/payment/payment.service';
import { BlockService } from 'src/modules/block/block.service';
import { PaymentStatus } from 'src/modules/db/prisma/client';
import { jest } from '@jest/globals';

describe('PaymentService (e2e)', () => {
  let app: INestApplication<App>;
  let blockService: BlockService;
  let dbService: DbService;
  let dbClear: () => void;
  let accountService: AccountService;
  let paymentService: PaymentService;

  beforeAll(async () => {
    dbClear = (await e2eUtils.runDbContainer()).clear;

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    blockService = moduleFixture.get(BlockService);
    jest.spyOn(blockService, 'onModuleInit').mockResolvedValue(undefined);

    app = moduleFixture.createNestApplication();
    await app.init();

    dbService = app.get(DbService);
    accountService = app.get(AccountService);
    paymentService = app.get(PaymentService);

    const init = await dbService.init.findUnique({ where: { id: 0 } });
    (blockService as any).blockCursor = init!.lastBlockNumber;

    e2eUtils.stopAllCronJobs(app);
  }, 120_000);

  beforeEach(async () => {});

  it('should link payment to transfer', async () => {
    const wallet = new Wallet(e2eUtils.E2E_SEPOLIA_PRIV_KEY_1);

    const { body } = await request(app.getHttpServer())
      .post('/payment/create')
      .set('x-api-key', '')
      .send({
        amount: 0.01,
        paymentToken: PaymentTokens.USDC,
        productTitle: 'Test Product',
        productDescription: 'Test Description',
        callbackUrl: 'https://example.com',
      })
      .expect(201);

    await request(app.getHttpServer())
      .post('/payment/add-from-address')
      .set('x-api-key', '')
      .send({
        id: body.id,
        fromAddress: wallet.address,
      })
      .expect(201);

    const env = app.get(ConfigService).get('ENV');
    const provider = new JsonRpcProvider(
      e2eUtils.E2E_SEPOLIA_RPC,
      ChainId[env],
    );
    const signer = wallet.connect(provider);

    const token = new Contract(
      PaymentTokenAddresses[PaymentTokens.USDC][Environment.SEPOLIA],
      e2eUtils.ERC20_ABI,
      signer,
    );

    const tx = await token.transfer(
      accountService.root.address,
      0.01 * 10 ** 6,
    );
    await tx.wait();

    let payment;

    for (let i = 0; i < 30; i++) {
      await blockService.syncNewestBlock();
      payment = await dbService.payment.findUnique({
        where: { transferHash: tx.hash },
        include: { transfer: true },
      });
      if (payment?.status === PaymentStatus.COMPLETED) {
        break;
      }
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }

    expect(payment?.transfer?.hash).toBe(tx.hash);
    expect(payment?.status).toBe(PaymentStatus.COMPLETED);
  }, 120_000);

  // it('should link payment to transferFrom', async () => {
  //   const wallet1 = new Wallet(e2eUtils.E2E_SEPOLIA_PRIV_KEY_1);
  //   const wallet2 = new Wallet(e2eUtils.E2E_SEPOLIA_PRIV_KEY_2);

  //   const { body } = await request(app.getHttpServer())
  //     .post('/payment/create')
  //     .set('x-api-key', '')
  //     .send({
  //       amount: 0.01,
  //       paymentToken: PaymentTokens.USDC,
  //       productTitle: 'Test Product',
  //       productDescription: 'Test Description',
  //       callbackUrl: 'https://example.com',
  //     })
  //     .expect(201);

  //   await request(app.getHttpServer())
  //     .post('/payment/add-from-address')
  //     .set('x-api-key', '')
  //     .send({
  //       id: body.id,
  //       fromAddress: wallet1.address,
  //     })
  //     .expect(201);

  //   const env = app.get(ConfigService).get('ENV');
  //   const provider = new JsonRpcProvider(
  //     e2eUtils.E2E_SEPOLIA_RPC,
  //     ChainId[env],
  //   );
  //   const signer1 = wallet1.connect(provider);
  //   const signer2 = wallet2.connect(provider);

  //   const token1 = new Contract(
  //     PaymentTokenAddresses[PaymentTokens.USDC][Environment.SEPOLIA],
  //     e2eUtils.ERC20_ABI,
  //     signer1,
  //   );
  //   const token2 = new Contract(
  //     PaymentTokenAddresses[PaymentTokens.USDC][Environment.SEPOLIA],
  //     e2eUtils.ERC20_ABI,
  //     signer2,
  //   );
  //   const tx1 = await token1.approve(wallet2.address, 0.01 * 10 ** 6);
  //   await tx1.wait();

  //   const tx2 = await token2.transferFrom(
  //     wallet1.address,
  //     accountService.root.address,
  //     0.01 * 10 ** 6,
  //   );
  //   await tx2.wait();

  //   let payment;

  //   for (let i = 0; i < 30; i++) {
  //     await blockService.syncNewestBlock();
  //     payment = await dbService.payment.findUnique({
  //       where: { transferHash: tx2.hash },
  //       include: { transfer: true },
  //     });
  //     if (payment?.status === PaymentStatus.COMPLETED) {
  //       break;
  //     }
  //     await new Promise((resolve) => setTimeout(resolve, 2000));
  //   }

  //   expect(payment?.transfer?.hash).toBe(tx2.hash);
  //   expect(payment?.status).toBe(PaymentStatus.COMPLETED);
  // }, 120_000);

  afterAll(async () => {
    dbClear();
    await app.close();
  }, 60_000);
});
