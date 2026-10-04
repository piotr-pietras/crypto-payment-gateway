"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { PaymentDto } from "@/utils/types";
import { useTranslation } from "react-i18next";
import Image from "next/image";
import LoadingIndicator from "@/components/generic/LoadingIndicator";

interface Props {
  payment: PaymentDto;
}

export function QrCodePayment({ payment }: Props) {
  const { t } = useTranslation();
  const [qrCode, setQrCode] = useState<string | null>(null);

  useEffect(() => {
    const generateQrCode = async () => {
      const chainId = payment.tokenMetadata.chainId;
      const value = BigInt(
        Number(payment.amount) * 10 ** payment.tokenMetadata.decimals
      );
      // Many wallets have issues with sepolia tokens qr codes
      // mainnet usdc: 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48@1
      const qrCode = await QRCode.toDataURL(
        `ethereum:${payment.contractAddress}@${chainId}/transfer?address=${
          payment.toAddress
        }&uint256=${value.toString()}`
      );

      setQrCode(qrCode);
    };
    generateQrCode();
  }, [payment]);

  return (
    <div className="flex flex-col items-center gap-2">
      {qrCode ? (
        <Image
          width={48}
          height={48}
          src={qrCode}
          alt="QR Code"
          className="size-48"
        />
      ) : (
        <div className="flex items-center justify-center size-48">
          <LoadingIndicator size={32} />
        </div>
      )}
      <div>
        <div className="text-heading text-text-primary font-bold text-center">
          {t("payAddress.qrTitle")}
        </div>
        <div className="text-caption text-text-tertiary text-center">
          {t("payAddress.qrHint")}
        </div>
      </div>
    </div>
  );
}
