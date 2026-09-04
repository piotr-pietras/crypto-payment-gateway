import { Environment, PaymentTokenAddresses } from 'src/types';

export const isToAddressPaymentToken = (
  toAddress: string,
  env: Environment,
) => {
  return Object.keys(PaymentTokenAddresses).some(
    (token) => PaymentTokenAddresses[token][env] === toAddress,
  );
};
