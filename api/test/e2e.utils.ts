import { execSync } from 'node:child_process';
import { join } from 'node:path';
import { INestApplication } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';

export default class e2eUtils {
  static readonly E2E_SEPOLIA_RPC =
    'https://ethereum-sepolia-rpc.publicnode.com';
  static readonly ERC20_ABI = [
    'function transfer(address to, uint256 amount) returns (bool)',
    'function transferFrom(address from, address to, uint256 amount) returns (bool)',
    'function approve(address spender, uint256 amount) returns (bool)',
  ];
  /**
   * @description This sepolia account expects to have some USDC and ETH on it
   *
   * @access address: 0x03C3D122f18742ce48034b4d896579a233fb4FC8
   */
  static readonly E2E_SEPOLIA_PRIV_KEY_1 =
    '0x3afbf7b18bdcb044a4d9bd71176032fa3140ac9e9be532b6b631b0b75dab75b2';

  /**
   * @description This sepolia account expects to have some USDC and ETH on it
   *
   * @access address: 0xa36cA3AeA53357EE8F56D150C74fC340897eD1dc
   */
  static readonly E2E_SEPOLIA_PRIV_KEY_2 =
    '0xda6200a8d199f1799c8117e4a7a805da7cd856af189b30db61ebe636e8b31d4d';

  static stopAllCronJobs = (app: INestApplication) => {
    const registry = app.get(SchedulerRegistry);
    for (const job of registry.getCronJobs().values()) {
      job.stop();
    }
  };

  static runDbContainer = async () => {
    const apiDir = join(__dirname, '..');
    const dbContainer = 'crypto-payment-gateway-db-e2e';
    const databaseUrl =
      'postgres://postgres:postgres@127.0.0.1:5432/crypto_payment_gateway';

    process.env.DATABASE_URL = databaseUrl;
    execSync(`docker rm -f ${dbContainer} || true`, { stdio: 'inherit' });
    execSync(
      [
        'docker run -d',
        `--name ${dbContainer}`,
        '-e POSTGRES_USER=postgres',
        '-e POSTGRES_PASSWORD=postgres',
        '-e POSTGRES_DB=crypto_payment_gateway',
        '-p 5432:5432',
        '--health-cmd="pg_isready -U postgres"',
        '--health-interval=1s',
        '--health-timeout=5s',
        '--health-retries=30',
        'postgres:16-alpine',
      ].join(' '),
      { stdio: 'inherit' },
    );
    execSync(
      `until [ "$(docker inspect -f '{{.State.Health.Status}}' ${dbContainer})" = "healthy" ]; do sleep 1; done`,
      { stdio: 'inherit', shell: '/bin/bash' },
    );
    execSync('npx prisma migrate deploy --config prisma.config.e2e', {
      cwd: apiDir,
      stdio: 'inherit',
      env: { ...process.env, DATABASE_URL: databaseUrl },
    });

    return {
      clear: () =>
        execSync(`docker rm -f ${dbContainer}`, { stdio: 'inherit' }),
    };
  };
}
