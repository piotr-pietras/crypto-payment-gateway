import Card from "@/components/generic/Card";
import { ExpiredClockIcon } from "@/components/icons/ExpiredClockIcon";
import { ReturnButton } from "@/components/ui/ReturnButton";
import { isLocale } from "@/i18n/config";
import { getTranslation } from "@/i18n/server";
import { Api } from "@/utils/api";
import { buildMetadata } from "@/utils/metadata";
import { Page } from "@/utils/page";
import { PaymentDto } from "@/utils/types";
import { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

const ROUTE = "/[locale]/pay/fail";

export async function generateMetadata({
  searchParams,
}: PageProps<typeof ROUTE>): Promise<Metadata> {
  const { id } = await searchParams;
  return await buildMetadata(id);
}

export default async function FailPage({
  params,
  searchParams,
}: PageProps<typeof ROUTE>) {
  const { locale } = await params;
  const { id } = await searchParams;

  if (!isLocale(locale) || typeof id !== "string") {
    notFound();
  }

  const { t } = await getTranslation(locale);

  const api = new Api();
  const res = await api.getPayment(id);

  if (!res.ok) {
    notFound();
  }

  const data = (await res.json()) as PaymentDto;
  const redirectUrl = Page.verifyURL(data, ROUTE, locale);
  if (redirectUrl) {
    redirect(redirectUrl);
  }

  return (
    <div className="max-w-[768px] flex flex-1 sm:p-4 p-2">
      <Card>
        <div className="flex flex-col gap-6">
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="bg-warning-bg p-4 rounded-full">
              <ExpiredClockIcon size={32} />
            </div>
            <div className="flex flex-col gap-1">
              <h1 className="text-heading text-text-primary font-bold">
                {t("failPayment.title")}
              </h1>
              <span className="text-body text-text-secondary max-w-sm">
                {t("failPayment.description")}
              </span>
            </div>
          </div>
          <ReturnButton payment={data} />
        </div>
      </Card>
    </div>
  );
}
