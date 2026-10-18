import { Test, TestingModule } from '@nestjs/testing';
import {
  HttpException,
  INestApplication,
  ValidationPipe,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import request from 'supertest';
import { App } from 'supertest/types';
import { addMinutes, subMinutes } from 'date-fns';
import { AppModule } from './../src/app.module';
import { InitializerService } from './../src/modules/initializer/initializer.service';
import { DbService } from './../src/modules/db/db.service';
import { PaymentService } from './../src/modules/payment/payment.service';
import { PaymentStatus } from './../src/modules/db/prisma/enums';
import { PaymentTokenAddresses, PaymentTokens } from 'src/types';
import e2eUtils from './e2e.utils';
import { EtherscanService } from 'src/modules/etherscan/etherscan.service';
import { BlockService } from 'src/modules/block/block.service';

const FROM_ADDRESS = '0x742d35cc6634c0532925a3b844bc9e7595f0beb';

describe('PaymentService (e2e)', () => {
  let app: INestApplication<App>;
  let paymentService: PaymentService;
  let blockService: BlockService;
  let dbService: DbService;
  let dbClear: () => void;
  let etherscanMock: {
    getERC20Decimals: jest.Mock;
    getTokenMetadata: jest.Mock;
  };

  const basePaymentBody = {
    amount: '100.00',
    paymentToken: PaymentTokens.USDC,
    productTitle: 'Test Product',
    productDescription: 'Test Description',
    callbackUrl: 'https://example.com',
  };

  beforeAll(async () => {
    dbClear = (await e2eUtils.runDbContainer()).clear;

    etherscanMock = {
      getERC20Decimals: jest.fn().mockResolvedValue(6),
      getTokenMetadata: jest.fn().mockResolvedValue({
        name: 'USDC',
        chainId: 1,
        decimals: 6,
      }),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(InitializerService)
      .useValue({ onModuleInit: async () => {} })
      .overrideProvider(EtherscanService)
      .useValue(etherscanMock)
      .compile();

    blockService = moduleFixture.get(BlockService);
    jest.spyOn(blockService, 'onModuleInit').mockResolvedValue(undefined);

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
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
      ...basePaymentBody,
      amount: '100.02',
    });

    const payment = await dbService.payment.findUnique({
      where: { id: result.id },
    });
    const env = app.get(ConfigService).get('ENV');

    expect(result.path).toBe(`/en?id=${result.id}`);
    expect(payment!.amount.toString()).toBe('100.02');
    expect(payment!.status).toBe(PaymentStatus.CREATED);
    expect(payment!.contractAddress).toBe(
      PaymentTokenAddresses[PaymentTokens.USDC][env],
    );
  });

  it('rejects create payment when amount has more than 2 decimal places', async () => {
    const apiKey = app.get(ConfigService).get('API_KEY');

    const { body } = await request(app.getHttpServer())
      .post('/payment/create')
      .set('x-api-key', apiKey)
      .send({
        ...basePaymentBody,
        amount: '1.001',
      })
      .expect(400);

    expect(body.message).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/at most 2 decimal places/i),
      ]),
    );
  });

  it('adds from address to payment', async () => {
    const { id } = await paymentService.createPayment({
      ...basePaymentBody,
    });

    const before = new Date();
    const updated = await paymentService.addFromAddress({
      id: id,
      fromAddress: FROM_ADDRESS,
    });
    const after = new Date();

    const expirationMinutes = app
      .get(ConfigService)
      .get('PAYMENT_EXPIRATION_TIME_MINUTES');
    const payment = await dbService.payment.findUnique({ where: { id } });

    expect(updated.fromAddress).toBe(FROM_ADDRESS);
    expect(updated.status).toBe(PaymentStatus.PENDING);
    expect(payment!.validUntil).toBeDefined();
    expect(payment!.validUntil!.getTime()).toBeGreaterThanOrEqual(
      addMinutes(before, expirationMinutes).getTime(),
    );
    expect(payment!.validUntil!.getTime()).toBeLessThanOrEqual(
      addMinutes(after, expirationMinutes).getTime(),
    );
  });

  it('allows adding from address only when payment is created', async () => {
    const { id } = await paymentService.createPayment({
      ...basePaymentBody,
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
      ...basePaymentBody,
    });

    await paymentService.addFromAddress({
      id: id1,
      fromAddress: FROM_ADDRESS,
    });

    const { id: id2 } = await paymentService.createPayment({
      ...basePaymentBody,
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
    const contractAddress = PaymentTokenAddresses[PaymentTokens.USDC][env];
    const transferHash = '0xtransfer123';

    const { id } = await paymentService.createPayment({
      ...basePaymentBody,
    });

    await paymentService.addFromAddress({
      id: id,
      fromAddress: FROM_ADDRESS,
    });

    await dbService.transfer.create({
      data: {
        hash: transferHash,
        blockNumber: BigInt(1001),
        value: BigInt(100 * 10 ** 6),
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

  it('does not re-link an already claimed transfer to a newer pending payment', async () => {
    const env = app.get(ConfigService).get('ENV');
    const contractAddress = PaymentTokenAddresses[PaymentTokens.USDC][env];
    const transferHash = '0xtransfer-already-claimed';

    const { id: firstId } = await paymentService.createPayment({
      ...basePaymentBody,
    });
    await paymentService.addFromAddress({
      id: firstId,
      fromAddress: FROM_ADDRESS,
    });

    await dbService.transfer.create({
      data: {
        hash: transferHash,
        blockNumber: BigInt(1002),
        value: BigInt(100 * 10 ** 6),
        contractAddress,
        fromAddress: FROM_ADDRESS,
      },
    });

    await paymentService.linkPayment(transferHash);

    const { id: secondId } = await paymentService.createPayment({
      ...basePaymentBody,
    });
    await paymentService.addFromAddress({
      id: secondId,
      fromAddress: FROM_ADDRESS,
    });

    await expect(
      paymentService.linkPayment(transferHash),
    ).resolves.toBeUndefined();

    const first = await dbService.payment.findUnique({
      where: { id: firstId },
    });
    const second = await dbService.payment.findUnique({
      where: { id: secondId },
    });

    expect(first!.transferHash).toBe(transferHash);
    expect(first!.status).toBe(PaymentStatus.COMPLETED);
    expect(second!.transferHash).toBeNull();
    expect(second!.status).toBe(PaymentStatus.PENDING);
  });

  it('expires pending payments past validUntil', async () => {
    const { id: expiredId } = await paymentService.createPayment({
      ...basePaymentBody,
    });
    const { id: activeId } = await paymentService.createPayment({
      ...basePaymentBody,
      amount: '200.00',
    });
    const { id: completedId } = await paymentService.createPayment({
      ...basePaymentBody,
      amount: '300.00',
    });

    await paymentService.addFromAddress({
      id: expiredId,
      fromAddress: '0x0000000000000000000000000000000000000001',
    });
    await paymentService.addFromAddress({
      id: activeId,
      fromAddress: '0x0000000000000000000000000000000000000002',
    });
    await paymentService.addFromAddress({
      id: completedId,
      fromAddress: '0x0000000000000000000000000000000000000003',
    });

    await dbService.payment.update({
      where: { id: expiredId },
      data: { validUntil: subMinutes(new Date(), 1) },
    });
    await dbService.payment.update({
      where: { id: completedId },
      data: {
        validUntil: subMinutes(new Date(), 1),
        status: PaymentStatus.COMPLETED,
      },
    });

    await paymentService.handlePaymentExpiration();

    const expired = await dbService.payment.findUnique({
      where: { id: expiredId },
    });
    const active = await dbService.payment.findUnique({
      where: { id: activeId },
    });
    const completed = await dbService.payment.findUnique({
      where: { id: completedId },
    });

    expect(expired!.status).toBe(PaymentStatus.EXPIRED);
    expect(active!.status).toBe(PaymentStatus.PENDING);
    expect(completed!.status).toBe(PaymentStatus.COMPLETED);
  });

  afterAll(async () => {
    dbClear();
    await app.close();
  }, 60_000);
});
