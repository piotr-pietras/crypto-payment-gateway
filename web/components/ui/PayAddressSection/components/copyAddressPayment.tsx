import { PaymentDto } from "@/utils/types";
import { Trans, useTranslation } from "react-i18next";
import { Pressable } from "@/components/generic/Pressable";
import { toast } from "sonner";
import { CopyPasteIcon } from "@/components/icons/CopyPasteIcon";
import { InfoIcon } from "@/components/icons/InfoIcon";
import Image from "next/image";

type Props = {
  payment: PaymentDto;
};

export function CopyAddressPayment({ payment }: Props) {
  const { t } = useTranslation();
  const currency = payment.tokenMetadata.name.toUpperCase();
  const amount = Number(payment.amount).toFixed(2);

  const handleCopy = async () => {
    if (!payment.toAddress) return;
    await navigator.clipboard.writeText(payment.toAddress);
    toast.success(t("payAddress.copied"));
  };

  return (
    <div className="flex w-full flex-col gap-4">
      <div>
        <div className="text-heading font-bold text-text-primary text-center">
          {t("payAddress.copyTitle")}
        </div>
        <div className="text-caption text-text-tertiary text-center">
          <Trans
            i18nKey="payAddress.copyHint"
            values={{ amount, currency }}
            components={{
              bold: <strong className="font-bold text-text-primary" />,
            }}
          />
        </div>
      </div>

      <div className="flex flex-col overflow-hidden rounded-xl border border-border bg-background">
        <div className="flex items-center gap-2 p-2">
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <div className="text-body font-bold text-text-primary">
              {t("payAddress.walletAddressLabel")}
            </div>
            <div className="break-all font-mono text-caption text-text-primary">
              {payment.toAddress}
            </div>
          </div>
          <Pressable
            onClick={handleCopy}
            className="flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-2 text-caption text-text-secondary"
          >
            <CopyPasteIcon size={24} />
            {t("payAddress.copy")}
          </Pressable>
        </div>

        <div className="h-px bg-border" />

        <div className="flex flex-col gap-1 p-2">
          <div className="text-body font-bold text-text-primary">
            {t("payAddress.amountToSendLabel")}
          </div>
          <div className="flex items-center gap-2">
            <Image
              src={`/icons/${payment.tokenMetadata.name}_32.svg`}
              alt={payment.tokenMetadata.name}
              width={24}
              height={24}
            />
            <div className="text-body font-bold text-text-primary">
              {amount} {currency}
            </div>
          </div>
        </div>
      </div>
      <div className="flex justify-center gap-2">
        <InfoIcon size={16} />
        <div className="flex-1 text-caption text-text-secondary">
          {t("payAddress.exactAmountHint")}
        </div>
      </div>
    </div>
  );
}
