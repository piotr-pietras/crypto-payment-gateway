"use client";

import { PaymentDto } from "@/utils/types";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { io } from "socket.io-client";
import { ClockIcon } from "../icons/ClockIcon";

type Props = {
  payment: PaymentDto;
};

export function IncomingTransferSection({ payment }: Props) {
  const { t } = useTranslation();

  useEffect(() => {
    const socket = io({
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
    });

    socket.on("connect", () => {
      console.log("socket connected", socket.id);
      socket.emit("subscribe", payment.id);
    });

    socket.on("subscribe", (data: { paymentId: string }) => {
      console.log("subscribe", data);
    });

    socket.on("error", (data) => {
      console.error("socket error", data);
    });

    socket.on("disconnect", () => {
      console.log("socket disconnected");
    });

    return () => {
      socket.disconnect();
    };
  }, [payment.id]);

  return (
    <div className="flex flex-col items-center gap-1 border-t border-border pt-4">
      <div className="flex items-center gap-2 text-body text-text-secondary">
        <ClockIcon size={20} />
        <span>{t("incomingTransfer.waiting")}</span>
      </div>
      <p className="text-caption text-text-tertiary text-center">
        {t("incomingTransfer.autoUpdate")}
      </p>
    </div>
  );
}
