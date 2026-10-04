"use client";

import { useState } from "react";
import Input from "../generic/Input";
import { useTranslation } from "react-i18next";
import Button from "../generic/Button";
import { isAddress } from "ethers";
import { Api } from "@/utils/api";
import { redirect, useRouter } from "next/navigation";
import { Storage } from "@/utils/storage";
import { Pressable } from "../generic/Pressable";
import { formatUsedAt } from "@/utils/date";
import makeBlockie from "ethereum-blockies-base64";
import Image from "next/image";
import { PaymentDto } from "@/utils/types";

type Props = {
  payment: PaymentDto;
};

export function EnterFromAddressSection({ payment }: Props) {
  const { t } = useTranslation();
  const router = useRouter();
  const [address, setAddress] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [disabled, setDisabled] = useState(true);
  const [loading, setLoading] = useState(false);
  const recentAddresses = Storage.getRecentAddresses();

  const handleContinue = async () => {
    setLoading(true);
    const origin = window.location.origin;
    const api = new Api(origin);
    const res = await api.addFromAddress(payment.id, address);
    if (!res.ok && res.status === 409) {
      const data = (await res.json()) as { conflictPayment: { id: string } };
      router.push(
        `/pay/conflict/?id=${data.conflictPayment.id}&returnId=${payment.id}`
      );
      return;
    }
    Storage.saveRecentAddress(address);
    redirect(`/pay/?id=${payment.id}`);
  };

  const onAddressChange = (value: string) => {
    const v = value.replace(/\s/g, "");
    setAddress(v);
    if (v.length >= 42) {
      const isValid = isAddress(v);
      setDisabled(!isValid);
      setError(isValid ? null : t("fromAddress.error"));
    } else {
      setError(null);
      setDisabled(true);
    }
  };

  return (
    <div className="w-full flex flex-col gap-4">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <div className="text-heading text-text-primary font-bold">
            {t("fromAddress.title")}
          </div>
          <div className="text-body text-text-secondary">
            {t("fromAddress.description-1", {
              currency: payment.tokenMetadata.name.toUpperCase(),
            })}{" "}
            <br />
            {t("fromAddress.description-2")}
          </div>
        </div>
        <div>
          <Input
            value={address}
            onChange={onAddressChange}
            label={t("fromAddress.label")}
            showPaste
            placeholder="0x..."
            leftIcon={(v) => {
              const isValid = isAddress(v);
              if (isValid) {
                return (
                  <Image
                    className="size-6 rounded-sm"
                    width={32}
                    height={32}
                    src={makeBlockie(v)}
                    alt={""}
                  />
                );
              }
              return (
                <div className="size-6 rounded-sm border border-border-strong" />
              );
            }}
          />
          {error ? (
            <div className="text-caption text-text-danger">{error}</div>
          ) : (
            <div className="text-caption text-text-tertiary">
              {t("fromAddress.error-placeholder")}
            </div>
          )}
        </div>
        {recentAddresses.length > 0 && (
          <div className="flex flex-col gap-2">
            <div className="text-body text-text-primary font-bold">
              {t("fromAddress.recentTitle")}
            </div>
            {recentAddresses.map((item) => {
              const selected =
                address.toLowerCase() === item.address.toLowerCase();
              return (
                <Pressable
                  key={item.address}
                  onClick={() => onAddressChange(item.address)}
                  className={`flex w-full items-center gap-2 overflow-hidden rounded-lg border bg-surface p-4 text-left ${
                    selected
                      ? "border-border-strong opacity-100"
                      : "border-transparent opacity-70"
                  }`}
                >
                  <Image
                    width={32}
                    height={32}
                    src={makeBlockie(item.address)}
                    alt={item.address}
                    className="size-10 rounded-sm"
                  />
                  <div className="flex-1 truncate font-mono text-body text-text-primary">
                    {item.address}
                  </div>
                  <div className="text-caption text-text-tertiary">
                    {formatUsedAt(item.usedAt, t)}
                  </div>
                </Pressable>
              );
            })}
          </div>
        )}
      </div>
      <Button
        disabled={disabled}
        loading={loading}
        onClick={handleContinue}
        variant="primary"
      >
        {t("fromAddress.button")}
      </Button>
    </div>
  );
}
