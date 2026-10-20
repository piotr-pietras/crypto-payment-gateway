/**
 * This is mirrored copy of the api's DTOs
 * For more check ../api/src/modules/-/-.dto.ts
 */

export enum PaymentStatus {
  CREATED = "CREATED",
  PENDING = "PENDING",
  PROCESSING = "PROCESSING",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
  CANCELLED = "CANCELLED",
  EXPIRED = "EXPIRED",
}

export type PaymentTokenName = "usdc" | "usdt";

export type TokenMetadata = {
  name: PaymentTokenName;
  chainId: number;
  decimals: number;
};

export type PaymentDto = {
  id: string;
  amount: string;
  fromAddress: string | null;
  status: PaymentStatus;
  contractAddress: string;
  toAddress: string;
  productTitle: string;
  productDescription: string;
  productImageUrl: string | null;
  validUntil: string | null;
  returnUrl: string;
  tokenMetadata: TokenMetadata;
};
