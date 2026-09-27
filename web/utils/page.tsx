import { PaymentDto, PaymentStatus } from "./types";

export class Page {
  static verifyURL(payment: PaymentDto, currentRoute: string) {
    const noLocaleRoute = currentRoute.replace("/[locale]", "");

    switch (payment.status) {
      case PaymentStatus.CREATED:
        if (noLocaleRoute === "") return null;
        return `/?id=${payment.id}`;
      case PaymentStatus.PENDING:
        if (noLocaleRoute === "/pay") return null;
        return `/pay/?id=${payment.id}`;
      case PaymentStatus.COMPLETED:
        if (noLocaleRoute === "/pay/success") return null;
        return `/pay/success/?id=${payment.id}`;
      default:
        return null;
    }
  }
}
