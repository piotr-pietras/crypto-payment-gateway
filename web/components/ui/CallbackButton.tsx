"use client";

import Button from "../generic/Button";
import { useTranslation } from "react-i18next";
import { PaymentDto } from "@/utils/types";
import { useMemo } from "react";

type Props = {
  payment: PaymentDto;
};

export function CallbackButton({ payment }: Props) {
  const { t } = useTranslation();

  const url = useMemo(() => {
    const url = new URL(payment.callbackUrl);
    url.searchParams.set("paymentId", payment.id);
    return url.toString();
  }, [payment.callbackUrl, payment.id]);

  return (
    <Button variant="primary" onClick={() => window.location.assign(url)}>
      {t("common.callbackButton")}
    </Button>
  );
}
