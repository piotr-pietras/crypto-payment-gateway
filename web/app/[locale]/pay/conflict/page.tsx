import Card from "@/components/generic/Card";
import { ClockIcon } from "@/components/icons/ClockIcon";
import { ConflictActions } from "@/components/ui/ConflictActions";
import { PaymentExpirationSection } from "@/components/ui/PaymentExpirationSection";
import { ProductPreviewSection } from "@/components/ui/ProductPreviewSection";
import { isLocale } from "@/i18n/config";
import { getTranslation } from "@/i18n/server";
import { Api } from "@/utils/api";
import { buildMetadata } from "@/utils/metadata";
import { PaymentDto } from "@/utils/types";
import { Metadata } from "next";
import { notFound } from "next/navigation";

const ROUTE = "/[locale]/pay/conflict";

export async function generateMetadata({
  searchParams,
}: PageProps<typeof ROUTE>): Promise<Metadata> {
  const { id } = await searchParams;
  return await buildMetadata(id);
}

export default async function PayConflictPage({
  params,
  searchParams,
}: PageProps<typeof ROUTE>) {
  const { locale } = await params;
  const { id, returnId } = await searchParams;

  if (
    !isLocale(locale) ||
    typeof id !== "string" ||
    typeof returnId !== "string"
  ) {
    notFound();
  }

  const { t } = await getTranslation(locale);

  const api = new Api();
  const res = await api.getPayment(id);

  if (!res.ok) {
    notFound();
  }

  const data = (await res.json()) as PaymentDto;

  return (
    <div className="max-w-[768px] flex flex-1 sm:p-4 p-2">
      <Card>
        <div className="flex flex-col gap-6">
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="bg-warning-bg p-4 rounded-full text-warning">
              <ClockIcon size={32} />
            </div>
            <div className="flex flex-col gap-1">
              <h1 className="text-heading text-text-primary font-bold">
                {t("conflictPayment.title")}
              </h1>
              <span className="text-body text-text-secondary max-w-md">
                {t("conflictPayment.description")}
              </span>
            </div>
          </div>

          <ProductPreviewSection payment={data} />
          <PaymentExpirationSection payment={data} isConflict />
          <ConflictActions
            pendingPaymentId={data.id}
            returnPaymentId={returnId}
          />
        </div>
      </Card>
    </div>
  );
}
