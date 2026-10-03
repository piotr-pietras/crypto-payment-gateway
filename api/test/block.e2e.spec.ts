import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { App } from 'supertest/types';
import { SchedulerRegistry } from '@nestjs/schedule';
import { Interface } from 'ethers';
import { AppModule } from './../src/app.module';
import { EtherscanService } from './../src/modules/etherscan/etherscan.service';
import { InitializerService } from './../src/modules/initializer/initializer.service';
import { BlockService } from './../src/modules/block/block.service';
import { DbService } from './../src/modules/db/db.service';
import { AccountService } from './../src/modules/account/account.service';
import {
  GetBlockByNumberResponse,
  GetERC20TokenTransferResponse,
} from './../src/modules/etherscan/etherscan.types';
import {
  Environment,
  ERC20TransferABI,
  ERC20TransferFromMethodId,
  ERC20TransferMethodId,
  PaymentTokenAddresses,
  PaymentTokens,
} from 'src/types';
import e2eUtils from './e2e.utils';

const mockTransfer = (
  overrides: Partial<GetERC20TokenTransferResponse[number]> = {},
): GetERC20TokenTransferResponse[number] => ({
  blockNumber: '1001',
  timeStamp: '1700000000',
  hash: '0xabc',
  nonce: '0',
  blockHash: '0xblock',
  from: '0xfrom',
  contractAddress: '0xtoken',
  to: '0xto',
  value: '100',
  tokenName: 'USD Coin',
  tokenSymbol: 'USDC',
  tokenDecimal: '6',
  functionName: 'transfer(address to, uint256 amount)',
  methodId: '0xa9059cbb',
  ...overrides,
});

const transferIface = new Interface(ERC20TransferABI);

const mockNewestBlockTx = (
  toAddress: string,
  overrides: Partial<GetBlockByNumberResponse['transactions'][number]> = {},
): GetBlockByNumberResponse['transactions'][number] => ({
  hash: '0xnewest',
  blockNumber: '1001',
  from: '0xfrom',
  to: PaymentTokenAddresses[PaymentTokens.USDC][Environment.SEPOLIA],
  value: '0x0',
  input: transferIface.encodeFunctionData('transfer', [toAddress, 100000000n]),
  ...overrides,
});

describe('BlockService (e2e)', () => {
  let app: INestApplication<App>;
  let blockService: BlockService;
  let dbService: DbService;
  let dbClear: () => void;
  let accountService: AccountService;
  let etherscanMock: {
    getBlockNumber: jest.Mock;
    getBlockByNumber: jest.Mock;
    getERC20TokenTransfer: jest.Mock;
    getERC20Decimals: jest.Mock;
  };

  beforeAll(async () => {
    dbClear = (await e2eUtils.runDbContainer()).clear;

    etherscanMock = {
      getBlockNumber: jest.fn(),
      getBlockByNumber: jest.fn(),
      getERC20TokenTransfer: jest.fn(),
      getERC20Decimals: jest.fn().mockResolvedValue(6),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(InitializerService)
      .useValue(new InitializerService())
      .overrideProvider(EtherscanService)
      .useValue(etherscanMock)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    blockService = app.get(BlockService);
    dbService = app.get(DbService);
    accountService = app.get(AccountService);

    e2eUtils.stopAllCronJobs(app);

    await dbService.init.create({
      data: { id: 0, phraseHash: 'test', lastBlockNumber: BigInt(1000) },
    });
  }, 120_000);

  beforeEach(async () => {
    jest.clearAllMocks();
    (blockService as any).lastBlockCheckTimestamp = 0;
    (blockService as any).lastBlockCheckNumber = BigInt(0);
    await dbService.transfer.deleteMany();
    await dbService.init.update({
      where: { id: 0 },
      data: { lastBlockNumber: BigInt(1000) },
    });
  });

  afterAll(async () => {
    dbClear();
    await app.close();
  }, 60_000);

  it('registers the syncHistoryBlocks cron job', () => {
    const registry = app.get(SchedulerRegistry);
    expect(registry.doesExist('cron', 'syncHistoryBlocks')).toBe(true);
  });

  it('should sync transfers when the syncHistoryBlocks function is called', async () => {
    etherscanMock.getBlockNumber.mockResolvedValue('1001');
    etherscanMock.getERC20TokenTransfer.mockResolvedValue([mockTransfer()]);

    await blockService.syncHistoryBlocks();

    const transfers = await dbService.transfer.findMany();
    expect(transfers).toHaveLength(1);
    expect(transfers[0].hash).toBe('0xabc');
  });

  it('filters out non-transfer ERC20 txs in syncHistoryBlocks', async () => {
    etherscanMock.getBlockNumber.mockResolvedValue('1001');
    etherscanMock.getERC20TokenTransfer.mockResolvedValue([
      mockTransfer({ hash: '0xdrop', methodId: '0x00000000' }),
      mockTransfer({
        hash: '0xkeep1',
        methodId: ERC20TransferMethodId,
      }),
      mockTransfer({
        hash: '0xkeep2',
        methodId: ERC20TransferFromMethodId,
      }),
    ]);

    await blockService.syncHistoryBlocks();

    const transfers = await dbService.transfer.findMany();
    expect(transfers).toHaveLength(2);
    expect(transfers[0].hash).toBe('0xkeep1');
    expect(transfers[1].hash).toBe('0xkeep2');
  });

  it('deduplicates transfers on repeated syncHistoryBlocks', async () => {
    etherscanMock.getBlockNumber.mockResolvedValue('1001');
    etherscanMock.getERC20TokenTransfer.mockResolvedValue([mockTransfer()]);

    await blockService.syncHistoryBlocks();
    await blockService.syncHistoryBlocks();

    expect(await dbService.transfer.count()).toBe(1);
  });

  it('registers the syncNewestBlock cron job', () => {
    const registry = app.get(SchedulerRegistry);
    expect(registry.doesExist('cron', 'syncNewestBlock')).toBe(true);
  });

  it('should sync transfers when the syncNewestBlock function is called', async () => {
    const tx = mockNewestBlockTx(accountService.root.address);
    etherscanMock.getBlockNumber.mockResolvedValue('1001');
    etherscanMock.getBlockByNumber.mockResolvedValue({ transactions: [tx] });

    await blockService.syncNewestBlock();

    const transfers = await dbService.transfer.findMany();
    expect(transfers).toHaveLength(1);
    expect(transfers[0].hash).toBe('0xnewest');
    expect(transfers[0].value).toBe(BigInt(100 * 10 ** 6));
    expect(transfers[0].contractAddress).toBe(tx.to);
    expect(transfers[0].fromAddress).toBe(tx.from);
  });

  it('deduplicates transfers on repeated syncNewestBlock', async () => {
    const tx = mockNewestBlockTx(accountService.root.address);
    etherscanMock.getBlockNumber.mockResolvedValue('1001');
    etherscanMock.getBlockByNumber.mockResolvedValue({ transactions: [tx] });

    await blockService.syncNewestBlock();

    (blockService as any).lastBlockCheckTimestamp = 0;
    (blockService as any).lastBlockCheckNumber = BigInt(0);

    await blockService.syncNewestBlock();

    expect(await dbService.transfer.count()).toBe(1);
  });

  it('ignores newest-block txs that are not transfers to the root address', async () => {
    const tx = mockNewestBlockTx('0x0000000000000000000000000000000000000001');
    etherscanMock.getBlockNumber.mockResolvedValue('1001');
    etherscanMock.getBlockByNumber.mockResolvedValue({ transactions: [tx] });

    await blockService.syncNewestBlock();

    expect(await dbService.transfer.count()).toBe(0);
  });

  it('filters out non-transfer ERC20 txs in syncNewestBlock', async () => {
    const root = accountService.root.address;
    const approveIface = new Interface([
      'function approve(address spender, uint256 amount)',
    ]);

    etherscanMock.getBlockNumber.mockResolvedValue('1001');
    etherscanMock.getBlockByNumber.mockResolvedValue({
      transactions: [
        mockNewestBlockTx(root, {
          hash: '0xdrop',
          input: approveIface.encodeFunctionData('approve', [root, 100000000n]),
        }),
        mockNewestBlockTx(root, { hash: '0xkeep1' }),
        mockNewestBlockTx(root, {
          hash: '0xkeep2',
          input: transferIface.encodeFunctionData('transferFrom', [
            '0x0000000000000000000000000000000000000001',
            root,
            100000000n,
          ]),
        }),
      ],
    });

    await blockService.syncNewestBlock();

    const transfers = await dbService.transfer.findMany();
    expect(transfers).toHaveLength(2);
    expect(transfers[0].hash).toBe('0xkeep1');
    expect(transfers[1].hash).toBe('0xkeep2');
  });

  it('throws when the app has not been initialized', async () => {
    await dbService.init.delete({ where: { id: 0 } });

    etherscanMock.getBlockNumber.mockResolvedValue('1001');
    await expect(blockService.syncHistoryBlocks()).rejects.toThrow();
  });
});
