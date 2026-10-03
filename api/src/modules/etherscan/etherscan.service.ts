import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EnvironmentVariables } from '../env/env.validation';
import {
  ChainId,
  ERC20DecimalsABI,
  ERC20TransferFromMethodId,
  ERC20TransferMethodId,
  PaymentTokens,
} from 'src/types';
import {
  EtherscanResponse,
  GetBlockByNumberResponse,
  GetERC20TokenTransferResponse,
} from './etherscan.types';
import { Mutex } from 'async-mutex';
import { Interface } from 'ethers';

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
  private decimalsCache: Record<PaymentTokens, number | null> = {
    [PaymentTokens.USDC]: null,
  };

  constructor(
    private readonly env: ConfigService<
      Record<keyof EnvironmentVariables, string>,
      true
    >,
  ) {
    this.chainId = ChainId[env.get('ENV')];
  }

  async getERC20Decimals(address: string): Promise<number> {
    if (this.decimalsCache[address]) return this.decimalsCache[address];

    return this.rateLimited(async () => {
      const iface = new Interface(ERC20DecimalsABI);
      const queryParams = new URLSearchParams({
        chainid: this.chainId.toString(),
        module: 'proxy',
        action: 'eth_call',
        to: address,
        data: iface.encodeFunctionData('decimals'),
        tag: 'latest',
        apikey: this.env.get('ETHERSCAN_API_KEY'),
      });
      const response = await fetch(`${this.baseUrl}?${queryParams.toString()}`);
      const data = (await response.json()) as EtherscanResponse<string>;
      const decimals = parseInt(data.result, 16);
      this.decimalsCache[address] = decimals;
      return decimals;
    });
  }

  /**
   * Get ERC20 token transfers filter for transfer and transferFrom methods
   */
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
      return data.result.filter(
        (tx) =>
          tx.methodId.toLowerCase() === ERC20TransferMethodId ||
          tx.methodId.toLowerCase() === ERC20TransferFromMethodId,
      );
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
