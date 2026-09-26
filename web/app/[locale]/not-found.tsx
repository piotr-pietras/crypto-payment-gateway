import Image from "next/image";
import { getTranslation } from "@/i18n/server";
import { defaultLocale } from "@/i18n/config";

export default async function NotFound() {
  const { t } = await getTranslation(defaultLocale);

  return (
    <div className="p-4 flex flex-col items-center justify-center gap-4">
      <Image src={"/not-found.png"} alt="Not Found" width={600} height={0} />
      <div className="text-heading text-text-primary font-bold">
        {t("not-found.title")}
      </div>
      <div className="text-body text-text-tertiary">
        {t("not-found.description-1")}
        <br />
        {t("not-found.description-2")}
      </div>
    </div>
  );
}
