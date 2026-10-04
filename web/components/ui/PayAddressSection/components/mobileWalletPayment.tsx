import Button from "@/components/generic/Button";
import { PaymentDto } from "@/utils/types";
import { useTranslation } from "react-i18next";
import Image from "next/image";

type Props = {
  payment: PaymentDto;
};

export function MobileWalletPayment({ payment }: Props) {
  const { t } = useTranslation();

  /**
   * Open the wallet app with EIP-681 URI
   * @see https://eips.ethereum.org/EIPS/eip-681
   */
  const handleOpenWalletApp = async () => {
    const chainId = payment.tokenMetadata.chainId;
    const value = BigInt(
      Number(payment.amount) * 10 ** payment.tokenMetadata.decimals
    );

    window.open(
      `ethereum:${payment.contractAddress}@${chainId}/transfer?address=${
        payment.toAddress
      }&uint256=${value.toString()}`,
      "_blank"
    );
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex flex-row gap-4">
        <Button
          icon={
            <div className="flex flex-row -space-x-2">
              <Image
                src="/icons/metamask.svg"
                alt=""
                width={24}
                height={24}
                className="relative z-30"
              />
              <Image
                src="/icons/trustwallet.svg"
                alt=""
                width={24}
                height={24}
                className="relative z-20"
              />
              <Image
                src="/icons/coinbase.svg"
                alt=""
                width={24}
                height={24}
                className="relative z-10"
              />
            </div>
          }
          variant="soft"
          onClick={handleOpenWalletApp}
        >
          {t("payAddress.openWalletApp")}
        </Button>
      </div>
      <div>
        <div className="text-heading text-text-primary font-bold text-center">
          {t("payAddress.mobileTitle")}
        </div>
        <div className="text-caption text-text-tertiary text-center">
          {t("payAddress.mobileHint")}
        </div>
      </div>
    </div>
  );
}
