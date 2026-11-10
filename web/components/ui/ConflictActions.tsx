"use client";

import { useTranslation } from "react-i18next";
import { useRouter } from "next/navigation";
import Button from "../generic/Button";
import { getLocale } from "@/i18n/client";

type Props = {
  pendingPaymentId: string;
  returnPaymentId: string;
};

export function ConflictActions({ pendingPaymentId, returnPaymentId }: Props) {
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <div className="flex w-full flex-col gap-3">
      <Button
        variant="primary"
        onClick={() =>
          router.push(`/${getLocale()}/pay/?id=${pendingPaymentId}`)
        }
      >
        {t("conflictPayment.goToPending")}
        <span aria-hidden>→</span>
      </Button>
      <Button
        variant="secondary"
        onClick={() => router.push(`/${getLocale()}/?id=${returnPaymentId}`)}
      >
        {t("conflictPayment.useDifferentWallet")}
      </Button>
    </div>
  );
}
