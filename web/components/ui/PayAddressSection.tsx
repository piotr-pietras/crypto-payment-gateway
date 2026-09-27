"use client";

import { useTranslation } from "react-i18next";
import { PaymentDto } from "@/utils/types";
import { CopyPasteIcon } from "../icons/CopyPasteIcon";
import { Pressable } from "../generic/Pressable";

type Props = {
  payment: PaymentDto;
};

export function PayAddressSection({ payment }: Props) {
  const { t } = useTranslation();

  // TODO: Replace with gateway deposit address from API
  const amountLabel = `${Number(payment.amount).toFixed(2)} USDC`;

  const handleCopy = async () => {
    if (!payment.toAddress) return;
    await navigator.clipboard.writeText(payment.toAddress);
  };

  return (
    <div className="w-full flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <div className="text-heading text-text-primary font-bold">
          {t("payAddress.title", { currency: "USDC" })}
        </div>
        <div className="text-body text-text-secondary">
          {t("payAddress.description")}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-6 sm:gap-8">
        {/* TODO: Replace with QR code */}
        <div className="flex flex-col items-center gap-2 shrink-0">
          <div className="rounded-lg border border-border bg-surface p-3">
            <div className="size-40 bg-text-primary rounded-sm" aria-hidden />
          </div>
          <div className="text-caption text-text-tertiary">
            {t("payAddress.scanHint")}
          </div>
        </div>

        <div className="flex flex-col gap-6 flex-1">
          <div className="flex flex-col gap-1">
            <div className="text-caption text-text-secondary">
              {t("payAddress.amountLabel", { currency: "USDC" })}
            </div>
            <div className="text-heading text-text-primary font-bold">
              {amountLabel}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <div className="text-caption text-text-secondary">
              {t("payAddress.addressLabel")}
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-border bg-background p-2">
              <span className="flex-1 break-all text-body text-text-primary font-mono">
                {payment.toAddress}
              </span>
              <Pressable
                onClick={handleCopy}
                className="p-2 text-text-secondary"
              >
                <CopyPasteIcon size={32} />
              </Pressable>
            </div>
            <div className="text-caption text-text-tertiary">
              {t("payAddress.warning", { currency: "USDC" })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
