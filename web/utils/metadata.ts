import { PaymentDto } from "./types";
import { Api } from "./api";
import { Metadata } from "next";

export const buildMetadata = async (
  id?: string | string[]
): Promise<Metadata> => {
  if (typeof id !== "string") return {};

  const api = new Api();
  const res = await api.getPayment(id);
  if (!res.ok) return {};

  const data = (await res.json()) as PaymentDto;
  if (!data) return {};

  return {
    title: `Pay for ${data.productTitle}`,
    description:
      "Secure, fast crypto payments. Pay with USDC or USDT on Ethereum.",
  };
};
