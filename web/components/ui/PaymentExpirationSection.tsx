"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { PaymentDto } from "@/utils/types";
import { ClockIcon } from "../icons/ClockIcon";
import { Divider } from "../generic/Divider";
import { useRouter } from "next/navigation";

type Props = {
  payment: PaymentDto;
  isConflict?: boolean;
};

function formatCountdown(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(
    2,
    "0"
  )}`;
}

export function PaymentExpirationSection({
  payment,
  isConflict = false,
}: Props) {
  const { t } = useTranslation();
  const router = useRouter();

  const [remainingMs, setRemainingMs] = useState(() =>
    payment.validUntil ? new Date(payment.validUntil).getTime() - Date.now() : 0
  );

  useEffect(() => {
    if (!payment.validUntil) return;

    let isRedirecting = false;
    const expiresAt = new Date(payment.validUntil).getTime();
    const tick = () => {
      const remaining = expiresAt - Date.now();
      setRemainingMs(Math.max(0, remaining));
      if (remaining <= 0 && !isRedirecting) {
        isRedirecting = true;
        if (isConflict) {
          router.back();
          return;
        } else {
          setTimeout(() => router.push(`/pay/fail?id=${payment.id}`), 2500);
        }
      }
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [payment.validUntil, payment.id, router, isConflict]);

  if (!payment.validUntil) return null;

  return (
    <div className="flex w-full items-center gap-4 rounded-xl border border-warning-border bg-warning-bg p-4 sm:gap-6 sm:p-5">
      <div className="flex items-center gap-3 text-warning">
        <ClockIcon size={28} />
        <div className="flex flex-col">
          <span className="text-caption">
            {t("paymentExpiration.expiresIn")}
          </span>
          <span className="text-heading font-bold leading-tight tabular-nums">
            {formatCountdown(remainingMs)}
          </span>
        </div>
      </div>

      <Divider type="vertical" />

      <div className="flex min-w-0 flex-col gap-0.5 text-caption text-text-secondary">
        {t("paymentExpiration.cancelledAutomatically")}
      </div>
    </div>
  );
}
