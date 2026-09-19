import {
  IsEnum,
  IsEthereumAddress,
  IsNumber,
  IsString,
  IsUUID,
} from 'class-validator';
import { PaymentTokens } from 'src/types';
import { Payment, PaymentStatus } from '../db/prisma/client';

export class CreatePaymentReqBodyDto {
  @IsNumber({
    maxDecimalPlaces: 0,
  })
  amount: number;

  @IsEnum(PaymentTokens)
  paymentToken: PaymentTokens;
}

export class CreatePaymentResBodyDto {
  @IsUUID(7)
  id: string;

  @IsString()
  url: string;
}

export class AddFromAddressReqBodyDto {
  @IsUUID(7)
  paymentId: string;

  @IsString()
  @IsEthereumAddress()
  fromAddress: string;
}

export class AddFromAddressResBodyDto implements Pick<
  Payment,
  | 'id'
  | 'fromAddress'
  | 'status'
  | 'contractAddress'
> {
  id: string;
  amount: string;
  fromAddress: string | null;
  status: PaymentStatus;
  contractAddress: string | null;
}
