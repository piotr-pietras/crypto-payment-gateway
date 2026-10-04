"use client";

import { PaymentDto } from "@/utils/types";
import { QrCodePayment } from "./components/qrCodePayment";
import { Divider } from "@/components/generic/Divider";
import { CopyAddressPayment } from "./components/copyAddressPayment";
import { MobileWalletPayment } from "./components/mobileWalletPayment";

type Props = {
  payment: PaymentDto;
};

export function PayAddressSection({ payment }: Props) {
  return (
    <div className="w-full flex flex-col gap-6">
      <div className="flex-col sm:flex-row gap-6 sm:gap-8">
        <div className="hidden sm:block">
          <QrCodePayment payment={payment} />
        </div>
        <div className="block sm:hidden">
          <MobileWalletPayment payment={payment} />
        </div>

        <Divider type="or" />

        <CopyAddressPayment payment={payment} />
      </div>
    </div>
  );
}
