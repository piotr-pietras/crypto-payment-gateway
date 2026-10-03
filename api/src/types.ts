export enum Environment {
  SEPOLIA = 'sepolia',
  MAINNET = 'mainnet',
}

export enum PaymentTokens {
  USDC = 'usdc',
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
    [Environment.MAINNET]: '0x0000000000000000000000000000000000000000',
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