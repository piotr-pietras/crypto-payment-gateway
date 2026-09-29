import { Environment, PaymentTokenAddresses } from 'src/types';

/**
 *  @description Check if the to address is a payment token address
 */
export const isToAddressPaymentToken = (
  toAddress: string,
  env: Environment,
) => {
  return Object.keys(PaymentTokenAddresses).some(
    (token) => PaymentTokenAddresses[token][env] === toAddress,
  );
};
