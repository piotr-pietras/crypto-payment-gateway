-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('CREATED', 'PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "TransferStatus" AS ENUM ('NEW', 'USED');

-- CreateTable
CREATE TABLE "Init" (
    "id" INTEGER NOT NULL DEFAULT 0,
    "phraseHash" TEXT NOT NULL,
    "lastBlockNumber" BIGINT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Init_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "transferHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "PaymentStatus" NOT NULL DEFAULT 'CREATED',
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "amount" DECIMAL(18,4) NOT NULL,
    "contractAddress" TEXT NOT NULL,
    "fromAddress" TEXT,
    "validUntil" TIMESTAMP(3),
    "productTitle" TEXT NOT NULL,
    "productDescription" TEXT NOT NULL,
    "productImageUrl" TEXT,
    "callbackUrl" TEXT NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transfer" (
    "hash" TEXT NOT NULL,
    "blockNumber" BIGINT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "value" BIGINT NOT NULL,
    "contractAddress" TEXT NOT NULL,
    "fromAddress" TEXT NOT NULL,

    CONSTRAINT "Transfer_pkey" PRIMARY KEY ("hash")
);

-- CreateIndex
CREATE UNIQUE INDEX "Payment_transferHash_key" ON "Payment"("transferHash");

-- CreateIndex
CREATE INDEX "Payment_status_idx" ON "Payment"("status");

-- CreateIndex
CREATE INDEX "Payment_createdAt_idx" ON "Payment"("createdAt");

-- CreateIndex
CREATE INDEX "Transfer_value_contractAddress_fromAddress_idx" ON "Transfer"("value", "contractAddress", "fromAddress");

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_transferHash_fkey" FOREIGN KEY ("transferHash") REFERENCES "Transfer"("hash") ON DELETE SET NULL ON UPDATE CASCADE;
