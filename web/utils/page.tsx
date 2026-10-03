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
      case PaymentStatus.EXPIRED:
      case PaymentStatus.CANCELLED:
      case PaymentStatus.FAILED:
        if (noLocaleRoute === "/pay/fail") return null;
        return `/pay/fail/?id=${payment.id}`;
      default:
        return null;
    }
  }
}
