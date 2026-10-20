"use client";

import Button from "../generic/Button";
import { useTranslation } from "react-i18next";
import { PaymentDto } from "@/utils/types";
import { useMemo } from "react";

type Props = {
  payment: PaymentDto;
};

export function ReturnButton({ payment }: Props) {
  const { t } = useTranslation();

  const url = useMemo(() => {
    const url = new URL(payment.returnUrl);
    url.searchParams.set("paymentId", payment.id);
    return url.toString();
  }, [payment.returnUrl, payment.id]);

  return (
    <Button variant="primary" onClick={() => window.location.assign(url)}>
      {t("common.callbackButton")}
    </Button>
  );
}
