import { Test, TestingModule } from '@nestjs/testing';
import { HttpException, INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { InitializerService } from './../src/modules/initializer/initializer.service';
import { DbService } from './../src/modules/db/db.service';
import { PaymentService } from './../src/modules/payment/payment.service';
import { PaymentStatus } from './../src/modules/db/prisma/enums';
import {
  PaymentTokenAddresses,
  PaymentTokens,
} from 'src/types';
import e2eUtils from './e2e.utils';

const FROM_ADDRESS = '0x742d35cc6634c0532925a3b844bc9e7595f0beb';

describe('PaymentService (e2e)', () => {
  let app: INestApplication<App>;
  let paymentService: PaymentService;
  let dbService: DbService;
  let dbClear: () => void;

  beforeAll(async () => {
    dbClear = (await e2eUtils.runDbContainer()).clear;

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(InitializerService)
      .useValue(new InitializerService())
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    dbService = app.get(DbService);
    paymentService = app.get(PaymentService);

    e2eUtils.stopAllCronJobs(app);

    await dbService.init.create({
      data: { id: 0, phraseHash: 'test', lastBlockNumber: BigInt(1000) },
    });
  }, 120_000);

  beforeEach(async () => {
    await dbService.payment.deleteMany();
    await dbService.transfer.deleteMany();
  });

  it('creates new payment', async () => {
    const result = await paymentService.createPayment({
      amount: 100,
      paymentToken: PaymentTokens.USDC,
    });

    const payment = await dbService.payment.findUnique({ where: { id: result.id } });
    const env = app.get(ConfigService).get('ENV');

    expect(payment!.amount).toBe(BigInt(100));
    expect(payment!.status).toBe(PaymentStatus.CREATED);
    expect(payment!.contractAddress).toBe(
      PaymentTokenAddresses[PaymentTokens.USDC][env],
    );
  });

  it('adds from address to payment', async () => {
    const { id } = await paymentService.createPayment({
      amount: 100,
      paymentToken: PaymentTokens.USDC,
    });

    const updated = await paymentService.addFromAddress({
      id: id,
      fromAddress: FROM_ADDRESS,
    });

    expect(updated.fromAddress).toBe(FROM_ADDRESS);
    expect(updated.status).toBe(PaymentStatus.PENDING);
  });

  it('allows adding from address only when payment is created', async () => {
    const { id } = await paymentService.createPayment({
      amount: 100,
      paymentToken: PaymentTokens.USDC,
    });

    await dbService.payment.update({
      where: { id },
      data: { status: PaymentStatus.COMPLETED },
    });

    await expect(
      paymentService.addFromAddress({
        id: id,
        fromAddress: FROM_ADDRESS,
      }),
    ).rejects.toThrow(HttpException);
  });

  it('does not allow adding from address if conflict payment exists', async () => {
    const { id: id1 } = await paymentService.createPayment({
      amount: 100,
      paymentToken: PaymentTokens.USDC,
    });
    
    await paymentService.addFromAddress({
      id: id1,
      fromAddress: FROM_ADDRESS,
    });

    const { id: id2 } = await paymentService.createPayment({
      amount: 100,
      paymentToken: PaymentTokens.USDC,
    });

    await expect(
      paymentService.addFromAddress({
        id: id2,
        fromAddress: FROM_ADDRESS,
      }),
    ).rejects.toThrow(HttpException);
  });

  it('links payment to transfer', async () => {
    const env = app.get(ConfigService).get('ENV');
    const contractAddress =
      PaymentTokenAddresses[PaymentTokens.USDC][env];
    const transferHash = '0xtransfer123';

    const { id } = await paymentService.createPayment({
      amount: 100,
      paymentToken: PaymentTokens.USDC,
    });

    await paymentService.addFromAddress({
      id: id,
      fromAddress: FROM_ADDRESS,
    });

    await dbService.transfer.create({
      data: {
        hash: transferHash,
        blockNumber: BigInt(1001),
        amount: BigInt(100),
        contractAddress,
        fromAddress: FROM_ADDRESS,
      },
    });

    const linked = await paymentService.linkPayment(transferHash);

    expect(linked).toBeDefined();
    expect(linked!.transferHash).toBe(transferHash);

    const payment = await dbService.payment.findUnique({
      where: { id },
      include: { transfer: true },
    });

    expect(payment!.transferHash).toBe(transferHash);
    expect(payment!.transfer!.hash).toBe(transferHash);
  });

  afterAll(async () => {
    dbClear();
    await app.close();
  }, 60_000);
});
