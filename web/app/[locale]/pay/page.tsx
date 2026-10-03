import Card from "@/components/generic/Card";
import { Divider } from "@/components/generic/Divider";
import { IncomingTransferSection } from "@/components/ui/IncomingTransferSection";
import { PayAddressSection } from "@/components/ui/PayAddressSection";
import { PaymentExpirationSection } from "@/components/ui/PaymentExpirationSection";
import { isLocale } from "@/i18n/config";
import { Api } from "@/utils/api";
import { Page } from "@/utils/page";
import { PaymentDto } from "@/utils/types";
import { notFound, redirect } from "next/navigation";

const ROUTE = "/[locale]/pay";

export default async function PayPage({
  params,
  searchParams,
}: PageProps<typeof ROUTE>) {
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
  const redirectUrl = Page.verifyURL(data, ROUTE);
  if (redirectUrl) {
    redirect(redirectUrl);
  }

  return (
    <div className="p-4 max-w-[768px] flex flex-1">
      <Card>
        <PayAddressSection payment={data} />
        <Divider />
        <PaymentExpirationSection payment={data} />
        <Divider />
        <IncomingTransferSection payment={data} />
      </Card>
    </div>
  );
}
