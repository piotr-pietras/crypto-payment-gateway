import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { EtherscanService } from 'src/modules/etherscan/etherscan.service';
import { GetERC20TokenTransferResponse } from 'src/modules/etherscan/etherscan.types';
import { InitializerService } from 'src/modules/initializer/initializer.service';
import {
  Environment,
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
  methodId: ERC20TransferMethodId,
  ...overrides,
});

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;
  let currentBlock: bigint;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(InitializerService)
      .useValue({ onModuleInit: async () => {} })
      .compile();

    app = moduleFixture.createNestApplication({});
    await app.init();
    e2eUtils.stopAllCronJobs(app);
  });

  afterAll(async () => {
    await app.close();
  });

  it('should current block', async () => {
    const etherscanService = app.get(EtherscanService);
    currentBlock = BigInt(await etherscanService.getBlockNumber());
    expect(Number(currentBlock)).toBeGreaterThan(11585028);
  }, 10_000);

  it('should get ERC20 token transfer', async () => {
    const etherscanService = app.get(EtherscanService);
    const txs = await etherscanService.getERC20TokenTransfer({
      // This is google USDC's faucet address that used to have some transfer history
      address: '0x70E3Fb28e1794bb91D5bCEB7d66b731d0C61Af8e',
      startblock: (currentBlock - BigInt(500)).toString(),
      endblock: currentBlock.toString(),
    });
    expect(txs.length).toBeGreaterThan(0);
  });

  it('filters out non-transfer ERC20 txs', async () => {
    const etherscanService = app.get(EtherscanService);
    const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue({
      json: async () => ({
        status: '1',
        message: 'OK',
        result: [
          mockTransfer({ hash: '0xdrop', methodId: '0x00000000' }),
          mockTransfer({
            hash: '0xkeep1',
            methodId: ERC20TransferMethodId,
          }),
          mockTransfer({
            hash: '0xkeep2',
            methodId: ERC20TransferFromMethodId,
          }),
          mockTransfer({
            hash: '0xkeep3',
            methodId: ERC20TransferMethodId.toUpperCase(),
          }),
        ],
      }),
    } as Response);

    try {
      const txs = await etherscanService.getERC20TokenTransfer({
        address: '0x70E3Fb28e1794bb91D5bCEB7d66b731d0C61Af8e',
        startblock: '0',
        endblock: '1',
      });

      expect(txs).toHaveLength(3);
      expect(txs.map((tx) => tx.hash)).toEqual([
        '0xkeep1',
        '0xkeep2',
        '0xkeep3',
      ]);
    } finally {
      fetchSpy.mockRestore();
    }
  });

  it('should get ERC20 decimals', async () => {
    const etherscanService = app.get(EtherscanService);
    const decimals = await etherscanService.getERC20Decimals(
      PaymentTokenAddresses[PaymentTokens.USDC][Environment.SEPOLIA],
    );
    expect(decimals).toBe(6);
  });

  it('should not exceed rate limit', async () => {
    const etherscanService = app.get(EtherscanService);
    let errors = 0;
    for (let i = 0; i < 10; i++) {
      const res = await etherscanService.getBlockNumber();
      try {
        BigInt(res);
      } catch (error) {
        errors++;
      }
    }
    expect(errors).toBeLessThan(1);
  }, 10_000);
});
