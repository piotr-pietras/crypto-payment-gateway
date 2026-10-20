import { Body, Controller, Get, Post, Put, Query, UseGuards } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiConflictResponse,
  ApiExcludeEndpoint,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiResponse,
  ApiSecurity,
  ApiTags,
} from '@nestjs/swagger';
import { ApiKeyGuard } from 'src/guards/apikey.guard';
import {
  AddFromAddressReqBodyDto,
  AddFromAddressResBodyDto,
  CancelPaymentResBodyDto,
  CreatePaymentReqBodyDto,
  CreatePaymentResBodyDto,
  GetPaymentResBodyDto,
} from './payment.dto';
import { PaymentService } from './payment.service';

@ApiTags('payment')
@ApiSecurity('x-api-key')
@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('create')
  @UseGuards(ApiKeyGuard)
  @ApiOperation({ summary: 'Create a new payment' })
  @ApiBody({
    type: CreatePaymentReqBodyDto,
    examples: {
      default: {
        value: {
          amount: '1.00',
          paymentToken: 'usdc',
          productTitle: 'Product Title',
          productDescription: 'Product Description',
          productImageUrl:
            'https://www.ortery.com/wp-content/uploads/2019/05/Dawn-Soap-og01.jpg',
          callbackUrl: 'https://example.com/en/pay/success',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Payment created successfully',
    type: CreatePaymentResBodyDto,
  })
  @ApiForbiddenResponse({
    description: 'Invalid or missing API key',
    example: {
      statusCode: 403,
      error: 'Forbidden',
      message: 'Invalid or missing API key',
    },
  })
  @ApiConflictResponse({
    description: 'Payment already exists',
    example: {
      statusCode: 409,
      error: 'Conflict',
      message: 'Payment already exists',
      conflictPayment: {
        id: '01932e4f-3c1a-7b2d-9e8f-1a2b3c4d5e6f',
      },
    },
  })
  async createPayment(
    @Body() body: CreatePaymentReqBodyDto,
  ): Promise<CreatePaymentResBodyDto> {
    return this.paymentService.createPayment(body);
  }


  @Get('/')
  @ApiOperation({ summary: 'Get a payment by ID' })
  @ApiResponse({
    status: 200,
    description: 'Payment found',
    type: GetPaymentResBodyDto,
  })
  @ApiNotFoundResponse({
    description: 'Payment not found',
    example: {
      statusCode: 404,
      error: 'Not Found',
      message: 'Payment not found',
    },
  })
  async getPayment(@Query('id') id: string): Promise<GetPaymentResBodyDto> {
    return this.paymentService.getPayment(id);
  }

  @Put('cancel')
  @UseGuards(ApiKeyGuard)
  @ApiOperation({ summary: 'Cancel a payment by ID' })
  @ApiResponse({
    status: 200,
    description: 'Payment cancelled successfully',
    type: CancelPaymentResBodyDto,
  })
  @ApiNotFoundResponse({
    description: 'Payment not found',
    example: {
      statusCode: 404,
      error: 'Not Found',
      message: 'Payment not found',
    },
  })
  @ApiBadRequestResponse({
    description: 'Payment is not in Created or Pending status',
    example: {
      statusCode: 400,
      error: 'Bad Request',
      message: 'Payment is not in Created or Pending status',
    },
  })
  async cancelPayment(@Query('id') id: string): Promise<CancelPaymentResBodyDto> {
    return this.paymentService.cancelPayment(id);
  }

  @Post('add-from-address')
  @ApiExcludeEndpoint()
  async addFromAddress(
    @Body() body: AddFromAddressReqBodyDto,
  ): Promise<AddFromAddressResBodyDto> {
    return this.paymentService.addFromAddress(body);
  }
}
