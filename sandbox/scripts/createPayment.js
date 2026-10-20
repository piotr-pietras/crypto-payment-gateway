const createPayment = async () => {
  const response = await fetch("http://localhost:7272/api/payment/create", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": "test",
    },
    body: JSON.stringify({
      amount: "1",
      paymentToken: "usdc",
      productTitle: "Product Title",
      productDescription: "Product Description",
      productImageUrl:
        "https://www.ortery.com/wp-content/uploads/2019/05/Dawn-Soap-og01.jpg",
      returnUrl: "https://example.com/pay/success",
      webhookUrl: "http://server:3000/webhook",
    }),
  });
  const data = await response.json();
  console.log(data);
};

createPayment();
