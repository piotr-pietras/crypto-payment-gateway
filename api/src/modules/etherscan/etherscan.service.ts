import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EnvironmentVariables } from '../env/env.validation';
import { ChainId } from 'src/types';
import {
  EtherscanResponse,
  GetBlockByNumberResponse,
  GetERC20TokenTransferResponse,
} from './etherscan.types';
import { Mutex } from 'async-mutex';

/**
 * Etherscan API
 *
 * @default Etherscan free tier allows 3 calls/sec.
 * @see https://docs.etherscan.io/endpoint-overview
 */
@Injectable()
export class EtherscanService {
  private readonly mutex = new Mutex();
  private readonly callsPerSec = 3;
  private readonly chainId: number;
  private readonly baseUrl: string = 'https://api.etherscan.io/v2/api';

  constructor(
    private readonly env: ConfigService<
      Record<keyof EnvironmentVariables, string>,
      true
    >,
  ) {
    this.chainId = ChainId[env.get('ENV')];
  }

  async getERC20TokenTransfer(params: {
    address: string;
    startblock: string | bigint | number;
    endblock: string | bigint | number;
  }) {
    return this.rateLimited(async () => {
      const queryParams = new URLSearchParams({
        chainid: this.chainId.toString(),
        module: 'account',
        action: 'tokentx',
        address: params.address,
        startblock: params.startblock.toString(),
        endblock: params.endblock.toString(),
        apikey: this.env.get('ETHERSCAN_API_KEY'),
      });
      const response = await fetch(`${this.baseUrl}?${queryParams.toString()}`);
      const data =
        (await response.json()) as EtherscanResponse<GetERC20TokenTransferResponse>;
      return data.result;
    });
  }

  async getBlockNumber(): Promise<string> {
    return this.rateLimited(async () => {
      const queryParams = new URLSearchParams({
        chainid: this.chainId.toString(),
        module: 'proxy',
        action: 'eth_blockNumber',
        apikey: this.env.get('ETHERSCAN_API_KEY'),
      });
      const response = await fetch(`${this.baseUrl}?${queryParams.toString()}`);
      const data = (await response.json()) as EtherscanResponse<string>;
      return data.result;
    });
  }

  async getBlockByNumber(
    blockNumber: bigint,
  ): Promise<GetBlockByNumberResponse> {
    return this.rateLimited(async () => {
      const queryParams = new URLSearchParams({
        chainid: this.chainId.toString(),
        module: 'proxy',
        action: 'eth_getBlockByNumber',
        tag: blockNumber.toString(16),
        apikey: this.env.get('ETHERSCAN_API_KEY'),
        boolean: 'true',
      });

      const response = await fetch(`${this.baseUrl}?${queryParams.toString()}`);
      const data =
        (await response.json()) as EtherscanResponse<GetBlockByNumberResponse>;
      return data.result;
    });
  }

  private async rateLimited<T>(fn: () => Promise<T>): Promise<T> {
    const release = await this.mutex.acquire();
    try {
      return await fn();
    } finally {
      const delay = Math.max(0, 1000 / this.callsPerSec);
      setTimeout(release, delay);
    }
  }
}
