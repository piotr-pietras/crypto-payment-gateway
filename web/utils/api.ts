export class Api {
  private origin: string;

  constructor(_origin?: string) {
    this.origin = _origin ?? "http://api:3000";
  }

  async getPayment(id: string) {
    return fetch(`${this.origin}/api/payment?id=${id}`, {
      cache: "no-store",
    });
  }

  async addFromAddress(id: string, fromAddress: string) {
    return fetch(`${this.origin}/api/payment/add-from-address`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id, fromAddress }),
    });
  }
}
