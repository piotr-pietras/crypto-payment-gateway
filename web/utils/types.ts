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

export type PaymentDto = {
  id: string;
  amount: string;
  fromAddress: string | null;
  status: PaymentStatus;
  contractAddress: string;
  contractName: string;
  toAddress: string;
  productTitle: string;
  productDescription: string;
  productImageUrl: string | null;
  validUntil: string | null;
  callbackUrl: string;
};
