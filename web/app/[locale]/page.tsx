import Card from "@/components/generic/Card";
import { EnterFromAddressSection } from "@/components/ui/EnterFromAddressSection";
import { isLocale } from "@/i18n/config";
import { Api } from "@/utils/api";
import { Page } from "@/utils/page";
import { PaymentDto } from "@/utils/types";
import { notFound, redirect } from "next/navigation";

const ROUTE = "/[locale]";

export default async function Home({
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
    <div className="flex flex-1 max-w-[768px] min-w-0 p-4">
      <Card>
        <EnterFromAddressSection id={id} />
      </Card>
    </div>
  );
}
