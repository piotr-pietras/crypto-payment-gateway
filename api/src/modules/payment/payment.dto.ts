import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsEthereumAddress,
  IsString,
  IsUrl,
  IsUUID,
  IsOptional,
  IsNumberString,
  Matches,
} from 'class-validator';
import { PaymentTokens } from 'src/types';
import type { TokenMetadata } from 'src/types';
import { Payment, PaymentStatus } from '../db/prisma/client';

export class CreatePaymentReqBodyDto {
  @ApiProperty({ example: '1.00' })
  @IsNumberString()
  @Matches(/^\d+(\.\d{1,2})?$/, {
    message: '"amount" must be a number string with at most 2 decimal places',
  })
  amount: string;

  @ApiProperty({ enum: PaymentTokens, example: PaymentTokens.USDC })
  @IsEnum(PaymentTokens)
  paymentToken: PaymentTokens;

  @ApiProperty({ example: 'Product Title' })
  @IsString()
  productTitle: string;

  @ApiProperty({ example: 'Product Description' })
  @IsString()
  productDescription: string;

  @ApiPropertyOptional({
    example:
      'https://www.ortery.com/wp-content/uploads/2019/05/Dawn-Soap-og01.jpg',
  })
  @IsString()
  @IsUrl()
  @IsOptional()
  productImageUrl?: string;

  @ApiProperty({
    example: 'https://example.com/en/pay/success',
    description:
      'Callback URL; additionally supplied with a "paymentId" search query param to easily identify the payment',
  })
  @IsString()
  @IsUrl()
  callbackUrl: string;
}

export class CreatePaymentResBodyDto {
  @ApiProperty({ example: '01932e4f-3c1a-7b2d-9e8f-1a2b3c4d5e6f' })
  @IsUUID(7)
  id: string;

  @ApiProperty({
    example: '/en?id=01932e4f-3c1a-7b2d-9e8f-1a2b3c4d5e6f',
  })
  @IsString()
  path: string;
}

export class AddFromAddressReqBodyDto {
  @ApiProperty({ example: '01932e4f-3c1a-7b2d-9e8f-1a2b3c4d5e6f' })
  @IsUUID(7)
  id: string;

  @ApiProperty({ example: '0x1234567890123456789012345678901234567890' })
  @IsString()
  @IsEthereumAddress()
  fromAddress: string;
}

export class AddFromAddressResBodyDto
  implements Pick<Payment, 'id' | 'fromAddress' | 'status' | 'contractAddress'>
{
  @ApiProperty({ example: '01932e4f-3c1a-7b2d-9e8f-1a2b3c4d5e6f' })
  id: string;

  @ApiProperty({ example: '100' })
  amount: string;

  @ApiProperty({
    example: '0x1234567890123456789012345678901234567890',
    nullable: true,
  })
  fromAddress: string | null;

  @ApiProperty({ enum: PaymentStatus, example: PaymentStatus.COMPLETED })
  status: PaymentStatus;

  @ApiProperty({ example: '0x1234567890123456789012345678901234567890' })
  contractAddress: string;

  @ApiProperty({ example: '0x1234567890123456789012345678901234567890' })
  toAddress: string;

  @ApiProperty({
    example: {
      chainId: 1,
      name: 'USDC',
      decimals: 6,
    },
  })
  tokenMetadata: TokenMetadata;
}

export class GetPaymentResBodyDto extends AddFromAddressResBodyDto {}

export class CancelPaymentResBodyDto {
  @ApiProperty({ example: '01932e4f-3c1a-7b2d-9e8f-1a2b3c4d5e6f' })
  id: string;
}
