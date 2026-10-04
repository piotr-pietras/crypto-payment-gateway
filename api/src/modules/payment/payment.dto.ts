import {
  IsEnum,
  IsEthereumAddress,
  IsNumber,
  IsString,
  IsUrl,
  IsUUID,
  IsOptional,
} from 'class-validator';
import { PaymentTokens, TokenMetadata } from 'src/types';
import { Payment, PaymentStatus } from '../db/prisma/client';

export class CreatePaymentReqBodyDto {
  @IsNumber({
    maxDecimalPlaces: 2,
  })
  amount: number;

  @IsEnum(PaymentTokens)
  paymentToken: PaymentTokens;

  @IsString()
  productTitle: string;

  @IsString()
  productDescription: string;

  @IsString()
  @IsUrl()
  @IsOptional()
  productImageUrl?: string;

  @IsString()
  @IsUrl()
  callbackUrl: string;
}

export class CreatePaymentResBodyDto {
  @IsUUID(7)
  id: string;

  @IsString()
  url: string;
}

export class AddFromAddressReqBodyDto {
  @IsUUID(7)
  id: string;

  @IsString()
  @IsEthereumAddress()
  fromAddress: string;
}

export class AddFromAddressResBodyDto
  implements Pick<Payment, 'id' | 'fromAddress' | 'status' | 'contractAddress'>
{
  id: string;
  amount: string;
  fromAddress: string | null;
  status: PaymentStatus;
  contractAddress: string;
  toAddress: string;
  tokenMetadata: TokenMetadata;
}

export class GetPaymentResBodyDto extends AddFromAddressResBodyDto {}
