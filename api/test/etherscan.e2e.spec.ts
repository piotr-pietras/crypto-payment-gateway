import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { EtherscanService } from 'src/modules/etherscan/etherscan.service';
import { InitializerService } from 'src/modules/initializer/initializer.service';
import { Environment, PaymentTokenAddresses, PaymentTokens } from 'src/types';
import e2eUtils from './e2e.utils';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;
  let currentBlock: bigint;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(InitializerService)
      .useValue(new InitializerService())
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
    currentBlock = BigInt(
      await etherscanService.getBlockNumber(),
    );
    expect(Number(currentBlock)).toBeGreaterThan(11585028);
  }, 10_000);

  it('should get ERC20 token transfer', async () => {
    const etherscanService = app.get(EtherscanService);
    const txs = await etherscanService.getERC20TokenTransfer({
      // This is google USDC's faucet address that used to have some transfer history
      address: "0x70E3Fb28e1794bb91D5bCEB7d66b731d0C61Af8e",
      startblock: (currentBlock - BigInt(100)).toString(),
      endblock: currentBlock.toString(),
    });
    expect(txs.length).toBeGreaterThan(0);
  });
});
