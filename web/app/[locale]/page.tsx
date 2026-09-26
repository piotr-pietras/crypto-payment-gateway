import Card from "@/components/generic/Card";
import { EnterFromAddressSection } from "@/components/ui/EnterFromAddressSection";
import { isLocale } from "@/i18n/config";
import { Api } from "@/utils/api";
import { PaymentDto, PaymentStatus } from "@/utils/types";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";

export default async function Home({
  params,
  searchParams,
}: PageProps<"/[locale]">) {
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

  switch (data.status) {
    case PaymentStatus.PENDING:
      return redirect(`/pay/?id=${id}`);
  }

  return (
    <div className="p-4 max-w-[768px] flex flex-1">
      <Card>
        <EnterFromAddressSection id={id} />
      </Card>
    </div>
  );
}
