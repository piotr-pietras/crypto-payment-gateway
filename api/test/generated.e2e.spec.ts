import { Test, TestingModule } from '@nestjs/testing';
import { HttpException, INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { App } from 'supertest/types';
import { Interface } from 'ethers';
import { AppModule } from './../src/app.module';
import { InitializerService } from './../src/modules/initializer/initializer.service';
import { DbService } from './../src/modules/db/db.service';
import { PaymentService } from './../src/modules/payment/payment.service';
import { BlockService } from './../src/modules/block/block.service';
import { AccountService } from './../src/modules/account/account.service';
import { EtherscanService } from './../src/modules/etherscan/etherscan.service';
import { PaymentStatus } from './../src/modules/db/prisma/enums';
import {
  Environment,
  ERC20TransferABI,
  PaymentTokenAddresses,
  PaymentTokens,
} from 'src/types';
import { GetBlockByNumberResponse } from './../src/modules/etherscan/etherscan.types';
import e2eUtils from './e2e.utils';

/**
 * Generated coverage for payment ↔ block integration and matching edge cases
 * that are not already covered by payment.e2e / block.e2e / index.e2e.
 *
 * Focus areas:
 * - BlockService sync paths calling PaymentService.linkPayment
 * - Cursor catch-up across missed blocks (replaces syncHistoryBlocks)
 * - transferFrom sender (= token `from`, not tx.from) used for matching
 * - linkPayment matching guards (amount / status / from)
 * - getPayment
 * - conflict slot freed after expiration
 */

const FROM_ADDRESS = '0x742d35cc6634c0532925a3b844bc9e7595f0beb0';
const OTHER_FROM = '0x00000000000000000000000000000000000000aa';
const SPENDER_ADDRESS = '0x00000000000000000000000000000000000000bb';

const transferIface = new Interface(ERC20TransferABI);

const mockNewestBlockTx = (
  toAddress: string,
  overrides: Partial<GetBlockByNumberResponse['transactions'][number]> = {},
  amount = 100000000n,
): GetBlockByNumberResponse['transactions'][number] => ({
  hash: '0xnewest-link',
  blockNumber: '1001',
  from: FROM_ADDRESS,
  to: PaymentTokenAddresses[PaymentTokens.USDC][Environment.SEPOLIA],
  value: '0x0',
  input: transferIface.encodeFunctionData('transfer', [toAddress, amount]),
  ...overrides,
});

describe('Generated Payment/Block (e2e)', () => {
  let app: INestApplication<App>;
  let paymentService: PaymentService;
  let blockService: BlockService;
  let dbService: DbService;
  let accountService: AccountService;
  let dbClear: () => void;
  let etherscanMock: {
    getBlockNumber: jest.Mock;
    getBlockByNumber: jest.Mock;
    getERC20Decimals: jest.Mock;
    getTokenMetadata: jest.Mock;
    getTransactionReceipt: jest.Mock;
  };

  const basePaymentBody = {
    amount: '100.00',
    paymentToken: PaymentTokens.USDC,
    productTitle: 'Test Product',
    productDescription: 'Test Description',
    callbackUrl: 'https://example.com',
  };

  /** Helper: CREATED → PENDING with a known fromAddress */
  const createPendingPayment = async (
    fromAddress = FROM_ADDRESS,
    overrides: Partial<typeof basePaymentBody> = {},
  ) => {
    const { id } = await paymentService.createPayment({
      ...basePaymentBody,
      ...overrides,
    });
    await paymentService.addFromAddress({ id, fromAddress });
    return id;
  };

  beforeAll(async () => {
    dbClear = (await e2eUtils.runDbContainer()).clear;

    etherscanMock = {
      getBlockNumber: jest.fn(),
      getBlockByNumber: jest.fn(),
      getERC20Decimals: jest.fn().mockResolvedValue(6),
      getTokenMetadata: jest.fn().mockResolvedValue({
        name: 'USDC',
        chainId: 1,
        decimals: 6,
      }),
      getTransactionReceipt: jest.fn().mockResolvedValue({
        blockHash: '0xblock',
        blockNumber: '1001',
        status: '0x1',
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

    // Seed init before app.init so BlockService.onModuleInit can set blockCursor
    dbService = moduleFixture.get(DbService);
    await dbService.init.create({
      data: { id: 0, phraseHash: 'test', lastBlockNumber: BigInt(1000) },
    });

    app = moduleFixture.createNestApplication();
    await app.init();

    paymentService = app.get(PaymentService);
    blockService = app.get(BlockService);
    accountService = app.get(AccountService);

    e2eUtils.stopAllCronJobs(app);
  }, 120_000);

  beforeEach(async () => {
    jest.clearAllMocks();
    // Reset BlockService rate-limit / last-seen state between tests
    (blockService as any).lastBlockCheckTimestamp = 0;
    (blockService as any).blockCursor = BigInt(1001);

    await dbService.payment.deleteMany();
    await dbService.transfer.deleteMany();
    await dbService.init.update({
      where: { id: 0 },
      data: { lastBlockNumber: BigInt(1000) },
    });

    etherscanMock.getERC20Decimals.mockResolvedValue(6);
    etherscanMock.getTokenMetadata.mockResolvedValue({
      name: 'USDC',
      chainId: 1,
      decimals: 6,
    });
    etherscanMock.getTransactionReceipt.mockResolvedValue({
      blockHash: '0xblock',
      blockNumber: '1001',
      status: '0x1',
    });
  });

  afterAll(async () => {
    dbClear();
    await app.close();
  }, 60_000);

  // ---------------------------------------------------------------------------
  // getPayment — not covered elsewhere
  // ---------------------------------------------------------------------------

  it('getPayment returns payment with toAddress and tokenMetadata', async () => {
    const { id } = await paymentService.createPayment(basePaymentBody);

    const result = await paymentService.getPayment(id);

    expect(result.id).toBe(id);
    expect(result.amount).toBe('100');
    expect(result.toAddress).toBe(accountService.root.address);
    expect(result.tokenMetadata).toEqual({
      name: 'USDC',
      chainId: 1,
      decimals: 6,
    });
    expect(etherscanMock.getTokenMetadata).toHaveBeenCalled();
  });

  it('getPayment throws when payment does not exist', async () => {
    await expect(
      paymentService.getPayment('01932e4f-3c1a-7b2d-9e8f-1a2b3c4d5e6f'),
    ).rejects.toThrow(HttpException);
  });

  // ---------------------------------------------------------------------------
  // Address normalization — service comment: addresses must be lowercase
  // ---------------------------------------------------------------------------

  it('addFromAddress stores fromAddress in lowercase', async () => {
    const { id } = await paymentService.createPayment(basePaymentBody);
    const mixedCase = '0x742D35Cc6634C0532925a3b844Bc9e7595F0bEb0';

    const updated = await paymentService.addFromAddress({
      id,
      fromAddress: mixedCase,
    });

    expect(updated.fromAddress).toBe(mixedCase.toLowerCase());

    const payment = await dbService.payment.findUnique({ where: { id } });
    expect(payment!.fromAddress).toBe(mixedCase.toLowerCase());
  });

  // ---------------------------------------------------------------------------
  // linkPayment matching guards — payment.e2e covers happy path + re-link only
  // ---------------------------------------------------------------------------

  it('linkPayment does not match CREATED payments (must be PENDING)', async () => {
    const env = app.get(ConfigService).get('ENV');
    const contractAddress = PaymentTokenAddresses[PaymentTokens.USDC][env];
    const transferHash = '0xlink-created-only';

    // CREATED, no addFromAddress → should never be linked
    await paymentService.createPayment(basePaymentBody);

    await dbService.transfer.create({
      data: {
        hash: transferHash,
        blockNumber: BigInt(1001),
        value: BigInt(100 * 10 ** 6),
        contractAddress,
        fromAddress: FROM_ADDRESS,
      },
    });

    await expect(paymentService.linkPayment(transferHash)).resolves.toBeUndefined();

    const payment = await dbService.payment.findFirst();
    expect(payment!.status).toBe(PaymentStatus.CREATED);
    expect(payment!.transferHash).toBeNull();
  });

  it('linkPayment does not match when transfer amount differs', async () => {
    const env = app.get(ConfigService).get('ENV');
    const contractAddress = PaymentTokenAddresses[PaymentTokens.USDC][env];
    const transferHash = '0xlink-wrong-amount';

    const id = await createPendingPayment();

    // Payment expects 100 USDC; transfer is 99 USDC
    await dbService.transfer.create({
      data: {
        hash: transferHash,
        blockNumber: BigInt(1001),
        value: BigInt(99 * 10 ** 6),
        contractAddress,
        fromAddress: FROM_ADDRESS,
      },
    });

    await expect(paymentService.linkPayment(transferHash)).resolves.toBeUndefined();

    const payment = await dbService.payment.findUnique({ where: { id } });
    expect(payment!.status).toBe(PaymentStatus.PENDING);
    expect(payment!.transferHash).toBeNull();
  });

  it('linkPayment does not match when fromAddress differs', async () => {
    const env = app.get(ConfigService).get('ENV');
    const contractAddress = PaymentTokenAddresses[PaymentTokens.USDC][env];
    const transferHash = '0xlink-wrong-from';

    const id = await createPendingPayment(FROM_ADDRESS);

    await dbService.transfer.create({
      data: {
        hash: transferHash,
        blockNumber: BigInt(1001),
        value: BigInt(100 * 10 ** 6),
        contractAddress,
        fromAddress: OTHER_FROM,
      },
    });

    await expect(paymentService.linkPayment(transferHash)).resolves.toBeUndefined();

    const payment = await dbService.payment.findUnique({ where: { id } });
    expect(payment!.status).toBe(PaymentStatus.PENDING);
    expect(payment!.transferHash).toBeNull();
  });

  // ---------------------------------------------------------------------------
  // Conflict after expiration — conflict filter is CREATED|PENDING only
  // ---------------------------------------------------------------------------

  it('allows reusing fromAddress+amount after the conflicting payment expires', async () => {
    const firstId = await createPendingPayment(FROM_ADDRESS);

    await dbService.payment.update({
      where: { id: firstId },
      data: {
        validUntil: new Date(Date.now() - 60_000),
      },
    });
    await paymentService.handlePaymentExpiration();

    const first = await dbService.payment.findUnique({ where: { id: firstId } });
    expect(first!.status).toBe(PaymentStatus.EXPIRED);

    // Same from + amount must be allowed once prior payment is EXPIRED
    const { id: secondId } = await paymentService.createPayment(basePaymentBody);
    const second = await paymentService.addFromAddress({
      id: secondId,
      fromAddress: FROM_ADDRESS,
    });

    expect(second.status).toBe(PaymentStatus.PENDING);
    expect(second.fromAddress).toBe(FROM_ADDRESS.toLowerCase());
  });

  // ---------------------------------------------------------------------------
  // BlockService → PaymentService integration (mocked chain)
  // index.e2e covers this on real Sepolia; these keep CI fast/deterministic
  // ---------------------------------------------------------------------------

  it('syncNewestBlock creates transfer and completes matching pending payment', async () => {
    const paymentId = await createPendingPayment(FROM_ADDRESS);
    const root = accountService.root.address;
    const tx = mockNewestBlockTx(root, { hash: '0xsync-newest-complete' });

    etherscanMock.getBlockNumber.mockResolvedValue('1001');
    etherscanMock.getBlockByNumber.mockResolvedValue({ transactions: [tx] });

    await blockService.syncNewestBlock();

    const payment = await dbService.payment.findUnique({
      where: { id: paymentId },
      include: { transfer: true },
    });

    expect(payment!.status).toBe(PaymentStatus.COMPLETED);
    expect(payment!.transferHash).toBe('0xsync-newest-complete');
    expect(payment!.transfer!.fromAddress).toBe(FROM_ADDRESS.toLowerCase());
    expect(payment!.transfer!.value).toBe(BigInt(100 * 10 ** 6));
  });

  it('syncNewestBlock transferFrom matches payment using token sender, not tx.from', async () => {
    // Critical: transferFrom(from, to, amount) → fromAddress must be `from` (token owner),
    // not the EOA that submitted the tx (spender).
    const paymentId = await createPendingPayment(FROM_ADDRESS);
    const root = accountService.root.address;

    const tx = mockNewestBlockTx(root, {
      hash: '0xsync-newest-transferFrom',
      from: SPENDER_ADDRESS, // spender / msg.sender — must NOT be used for payment match
      input: transferIface.encodeFunctionData('transferFrom', [
        FROM_ADDRESS, // token owner — payment.fromAddress
        root,
        100000000n,
      ]),
    });

    etherscanMock.getBlockNumber.mockResolvedValue('1001');
    etherscanMock.getBlockByNumber.mockResolvedValue({ transactions: [tx] });

    await blockService.syncNewestBlock();

    const transfer = await dbService.transfer.findUnique({
      where: { hash: '0xsync-newest-transferFrom' },
    });
    expect(transfer).toBeDefined();
    expect(transfer!.fromAddress).toBe(FROM_ADDRESS.toLowerCase());
    expect(transfer!.fromAddress).not.toBe(SPENDER_ADDRESS.toLowerCase());

    const payment = await dbService.payment.findUnique({
      where: { id: paymentId },
    });
    expect(payment!.status).toBe(PaymentStatus.COMPLETED);
    expect(payment!.transferHash).toBe('0xsync-newest-transferFrom');
  });

  it('syncNewestBlock catch-up links payment from a missed intermediate block', async () => {
    const paymentId = await createPendingPayment(FROM_ADDRESS);
    const root = accountService.root.address;
    const missedTx = mockNewestBlockTx(root, {
      hash: '0xmissed-block',
      blockNumber: '1002',
    });

    (blockService as any).blockCursor = 1001n;
    etherscanMock.getBlockNumber.mockResolvedValue('1003');
    etherscanMock.getBlockByNumber.mockImplementation(async (n: bigint) => ({
      transactions: n === 1002n ? [missedTx] : [],
    }));

    await blockService.syncNewestBlock();

    const payment = await dbService.payment.findUnique({
      where: { id: paymentId },
    });
    expect(payment!.status).toBe(PaymentStatus.COMPLETED);
    expect(payment!.transferHash).toBe('0xmissed-block');
    expect(etherscanMock.getBlockByNumber).toHaveBeenCalledTimes(3);
    expect((blockService as any).blockCursor).toBe(1004n);
  });

  it('syncNewestBlock catch-up completes payments from different blocks in one run', async () => {
    const firstId = await createPendingPayment(FROM_ADDRESS);
    const secondId = await createPendingPayment(OTHER_FROM, {
      amount: '50.00',
    });
    const root = accountService.root.address;

    const firstTx = mockNewestBlockTx(root, {
      hash: '0xcatchup-first',
      blockNumber: '1001',
      from: FROM_ADDRESS,
    });
    const secondTx = mockNewestBlockTx(
      root,
      {
        hash: '0xcatchup-second',
        blockNumber: '1003',
        from: OTHER_FROM,
      },
      50000000n,
    );

    (blockService as any).blockCursor = 1001n;
    etherscanMock.getBlockNumber.mockResolvedValue('1003');
    etherscanMock.getBlockByNumber.mockImplementation(async (n: bigint) => {
      if (n === 1001n) return { transactions: [firstTx] };
      if (n === 1003n) return { transactions: [secondTx] };
      return { transactions: [] };
    });

    await blockService.syncNewestBlock();

    const first = await dbService.payment.findUnique({ where: { id: firstId } });
    const second = await dbService.payment.findUnique({
      where: { id: secondId },
    });

    expect(first!.status).toBe(PaymentStatus.COMPLETED);
    expect(first!.transferHash).toBe('0xcatchup-first');
    expect(second!.status).toBe(PaymentStatus.COMPLETED);
    expect(second!.transferHash).toBe('0xcatchup-second');
    expect((blockService as any).blockCursor).toBe(1004n);
  });

  it('syncNewestBlock advances cursor through empty intermediate blocks', async () => {
    const paymentId = await createPendingPayment(FROM_ADDRESS);
    const root = accountService.root.address;
    const tipTx = mockNewestBlockTx(root, {
      hash: '0xempty-gap-tip',
      blockNumber: '1005',
    });

    (blockService as any).blockCursor = 1001n;
    etherscanMock.getBlockNumber.mockResolvedValue('1005');
    etherscanMock.getBlockByNumber.mockImplementation(async (n: bigint) => ({
      transactions: n === 1005n ? [tipTx] : [],
    }));

    await blockService.syncNewestBlock();

    const payment = await dbService.payment.findUnique({
      where: { id: paymentId },
    });
    expect(payment!.status).toBe(PaymentStatus.COMPLETED);
    expect(payment!.transferHash).toBe('0xempty-gap-tip');
    expect(etherscanMock.getBlockByNumber).toHaveBeenCalledTimes(5);
    expect((blockService as any).blockCursor).toBe(1006n);
  });

  it('syncNewestBlock is a no-op when tip is behind the cursor', async () => {
    const paymentId = await createPendingPayment(FROM_ADDRESS);

    (blockService as any).blockCursor = 1010n;
    etherscanMock.getBlockNumber.mockResolvedValue('1005');

    await blockService.syncNewestBlock();

    expect(etherscanMock.getBlockByNumber).not.toHaveBeenCalled();
    expect((blockService as any).blockCursor).toBe(1010n);

    const payment = await dbService.payment.findUnique({
      where: { id: paymentId },
    });
    expect(payment!.status).toBe(PaymentStatus.PENDING);
    expect(payment!.transferHash).toBeNull();
  });

  it('syncNewestBlock leaves pending payment untouched when amount does not match', async () => {
    const paymentId = await createPendingPayment(FROM_ADDRESS);
    const root = accountService.root.address;

    // 50 USDC on-chain vs 100 USDC payment
    const tx = mockNewestBlockTx(
      root,
      { hash: '0xsync-newest-amount-mismatch' },
      50000000n,
    );

    etherscanMock.getBlockNumber.mockResolvedValue('1001');
    etherscanMock.getBlockByNumber.mockResolvedValue({ transactions: [tx] });

    await blockService.syncNewestBlock();

    const transfer = await dbService.transfer.findUnique({
      where: { hash: '0xsync-newest-amount-mismatch' },
    });
    expect(transfer).toBeDefined(); // transfer is still ingested

    const payment = await dbService.payment.findUnique({
      where: { id: paymentId },
    });
    expect(payment!.status).toBe(PaymentStatus.PENDING);
    expect(payment!.transferHash).toBeNull();
  });
});
