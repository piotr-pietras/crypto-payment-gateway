"use client";

import { PaymentDto } from "@/utils/types";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { io } from "socket.io-client";
import { ClockIcon } from "../icons/ClockIcon";
import { useRouter } from "next/navigation";
import LoadingIndicator from "../generic/LoadingIndicator";

type Props = {
  payment: PaymentDto;
};

export function IncomingTransferSection({ payment }: Props) {
  const { t } = useTranslation();
  const router = useRouter();

  useEffect(() => {
    const socket = io({
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
    });

    socket.on("connect", () => {
      socket.emit("transfer:subscribe", payment.id);
    });

    socket.on("transfer", (data: { id: string }) => {
      if (data.id === payment.id) {
        router.push(`/pay/success/?id=${data.id}`);
      }
    });

    socket.on("transfer:subscribe", (data) => {
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
  }, [payment.id, router]);

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="flex items-center gap-2 text-body text-text-secondary">
        <LoadingIndicator size={24} />
        <span>{t("incomingTransfer.waiting")}</span>
      </div>
      <p className="text-caption text-text-tertiary text-center">
        {t("incomingTransfer.autoUpdate")}
      </p>
    </div>
  );
}
