import Card from "@/components/generic/Card";
import { Divider } from "@/components/generic/Divider";
import { IncomingTransferSection } from "@/components/ui/IncomingTransferSection";
import { PayAddressSection } from "@/components/ui/PayAddressSection";
import { isLocale } from "@/i18n/config";
import { Api } from "@/utils/api";
import { PaymentDto, PaymentStatus } from "@/utils/types";
import { notFound, redirect } from "next/navigation";

export default async function PayPage({
  params,
  searchParams,
}: PageProps<"/[locale]/pay">) {
  const { locale } = await params;
  const { id } = await searchParams;

  if (!isLocale(locale) || typeof id !== "string") {
    notFound();
  }

  const api = new Api();
  const res = await api.getPayment(id);

  if (!res.ok) {
    notFound();
  }

  const data = (await res.json()) as PaymentDto;

  if (data.status === PaymentStatus.CREATED) {
    redirect(`/${locale}?id=${id}`);
  }

  return (
    <div className="p-4 max-w-[768px] flex flex-1">
      <Card>
        <PayAddressSection payment={data} />
        <Divider />
        <IncomingTransferSection payment={data} />
      </Card>
    </div>
  );
}
