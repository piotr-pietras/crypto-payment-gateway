export enum Environment {
  SEPOLIA = 'sepolia',
  MAINNET = 'mainnet',
}

export enum PaymentTokens {
  USDC = 'usdc',
  USDT = 'usdt',
}

export interface TokenMetadata {
  chainId: number;
  name: string;
  decimals: number;
}

/**
 * The addresses of the payment tokens for each environment
 *
 * !!! IMPORTANT !!!
 * Make sure that addresses are in lowercase not in readable format
 */
export const PaymentTokenAddresses: Record<
  PaymentTokens,
  Record<Environment, string>
> = {
  [PaymentTokens.USDC]: {
    [Environment.SEPOLIA]: '0x1c7d4b196cb0c7b01d743fbc6116a902379c7238',
    [Environment.MAINNET]: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
  },
  [PaymentTokens.USDT]: {
    [Environment.SEPOLIA]: '0x7169d38820dfd117c3fa1f22a697dba58d90ba06',
    [Environment.MAINNET]: '0xdac17f958d2ee523a2206206994597c13d831ec7',
  },
} as const;

export const ChainId: Record<Environment, number> = {
  [Environment.SEPOLIA]: 11155111,
  [Environment.MAINNET]: 1,
} as const;

export const ERC20TransferABI = [
  'function transfer(address to, uint256 amount)',
  'function transferFrom(address from, address to, uint256 amount)',
] as const;

export const ERC20DecimalsABI = [
  'function decimals() view returns (uint8)',
] as const;

export const ERC20TransferMethodId = '0xa9059cbb';
export const ERC20TransferFuncName = 'transfer';
export const ERC20TransferFromMethodId = '0x23b872dd';
export const ERC20TransferFromFuncName = 'transferFrom';

export enum Locales {
  EN = 'en',
  EN_GB = 'en-GB',
  ES = 'es',
  FR = 'fr',
  DE = 'de',
  IT = 'it',
  RU = 'ru',
  EN_IN = 'en-IN',
  HI_IN = 'hi-IN',
  ZH_CN = 'zh-CN',
  ID = 'id',
  UR_PK = 'ur-PK',
  PT_BR = 'pt-BR',
  BN_BD = 'bn-BD',
  AR = 'ar',
  JA = 'ja',
  FIL = 'fil',
  VI = 'vi',
  TR = 'tr',
  KO = 'ko',
  TH = 'th',
  AM = 'am',
  SW = 'sw',
}
