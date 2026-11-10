import { defaultLocale, isLocale } from "@/i18n/config";
import { PaymentDto, PaymentStatus } from "./types";

export class Page {
  static verifyURL(
    payment: PaymentDto,
    currentRoute: string,
    _locale: string
  ) {
    const locale = isLocale(_locale ?? "") ? _locale : defaultLocale;
    const noLocaleRoute = currentRoute.replace("/[locale]", "");

    switch (payment.status) {
      case PaymentStatus.CREATED:
        if (noLocaleRoute === "") return null;
        return `/${locale}/?id=${payment.id}`;
      case PaymentStatus.PENDING:
        if (noLocaleRoute === "/pay") return null;
        return `/${locale}/pay/?id=${payment.id}`;
      case PaymentStatus.COMPLETED:
        if (noLocaleRoute === "/pay/success") return null;
        return `/${locale}/pay/success/?id=${payment.id}`;
      case PaymentStatus.EXPIRED:
      case PaymentStatus.CANCELLED:
      case PaymentStatus.FAILED:
        if (noLocaleRoute === "/pay/fail") return null;
        return `/${locale}/pay/fail/?id=${payment.id}`;
      default:
        return null;
    }
  }
}
