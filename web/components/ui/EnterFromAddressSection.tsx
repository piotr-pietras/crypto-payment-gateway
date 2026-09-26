"use client";

import { useState } from "react";
import Input from "../generic/Input";
import { useTranslation } from "react-i18next";
import Button from "../generic/Button";
import { isAddress } from "ethers";
import { Api } from "@/utils/api";
import { redirect } from "next/navigation";

type Props = {
  id: string;
};

export function EnterFromAddressSection({ id }: Props) {
  const { t } = useTranslation();

  const [address, setAddress] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [disabled, setDisabled] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleContinue = async () => {
    setLoading(true);
    const origin = window.location.origin;
    const api = new Api(origin);
    const res = await api.addFromAddress(id, address);
    if (!res.ok) {
      setError(t("fromAddress.error"));
    }
    redirect(`/pay/?id=${id}`);
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
            {/* TODO: Replace with currency */}
            {t("fromAddress.description-1", { currency: "USDC" })} <br />
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
          />
          {error ? (
            <div className="text-caption text-text-danger">{error}</div>
          ) : (
            <div className="text-caption text-text-tertiary">
              {t("fromAddress.error-placeholder")}
            </div>
          )}
        </div>
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
