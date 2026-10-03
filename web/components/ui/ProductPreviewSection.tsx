"use client";

import { useTranslation } from "react-i18next";
import { PaymentDto } from "@/utils/types";
import Image from "next/image";

type Props = {
  payment: PaymentDto;
  showAmount?: boolean;
};

export function ProductPreviewSection({ payment, showAmount = true }: Props) {
  const { t } = useTranslation();
  const amount = Number(payment.amount);

  const amountLabel = `${amount.toFixed(
    2
  )} ${payment.contractName.toUpperCase()}`;

  return (
    <div className="flex w-full flex-col gap-4 rounded-xl border border-border bg-background p-4 sm:flex-row sm:items-center sm:gap-6 sm:p-6">
      <div className="flex min-w-0 flex-1 items-center gap-4">
        {payment.productImageUrl && (
          <Image
            src={payment.productImageUrl}
            alt={payment.productTitle}
            className="rounded-lg object-cover"
            width={96}
            height={96}
          />
        )}
        <div className="flex min-w-0 flex-col gap-1">
          <div className="text-body font-bold text-text-primary">
            {payment.productTitle}
          </div>
          <div className="text-caption text-text-secondary">
            {payment.productDescription}
          </div>
          {showAmount && (
            <div className="sm:hidden block">
              <span className="text-caption text-text-secondary">
                {t("productPreview.amountLabel")}:{" "}
              </span>
              <span className="text-caption font-bold">{amountLabel}</span>
            </div>
          )}
        </div>
      </div>

      {showAmount && (
        <div className="sm:flex hidden items-center gap-6">
          <div className="h-16 w-px bg-border" />
          <div className="flex flex-col gap-0.5">
            <div className="text-caption text-text-secondary">
              {t("productPreview.amountLabel")}
            </div>
            <div className="text-heading font-bold text-text-primary">
              {amountLabel}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
