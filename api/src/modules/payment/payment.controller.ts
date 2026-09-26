import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBody,
  ApiForbiddenResponse,
  ApiOperation,
  ApiResponse,
  ApiSecurity,
  ApiTags,
} from '@nestjs/swagger';
import { ApiKeyGuard } from 'src/guards/apikey.guard';
import {
  AddFromAddressReqBodyDto,
  AddFromAddressResBodyDto,
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
          amount: 100,
          paymentToken: 'usdc',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Payment created successfully',
    type: CreatePaymentResBodyDto,
    example: {
      id: '01932e4f-3c1a-7b2d-9e8f-1a2b3c4d5e6f',
      url: 'https://example.com/en/pay?id=01932e4f-3c1a-7b2d-9e8f-1a2b3c4d5e6f',
    },
  })
  @ApiForbiddenResponse({
    description: 'Invalid or missing API key',
    example: {
      statusCode: 403,
      error: 'Forbidden',
      message: 'Invalid or missing API key',
    },
  })
  async createPayment(
    @Body() body: CreatePaymentReqBodyDto,
  ): Promise<CreatePaymentResBodyDto> {
    return this.paymentService.createPayment(body);
  }

  @Post('add-from-address')
  async addFromAddress(
    @Body() body: AddFromAddressReqBodyDto,
  ): Promise<AddFromAddressResBodyDto> {
    return this.paymentService.addFromAddress(body);
  }

  @Get('/')
  async getPayment(@Query('id') id: string): Promise<GetPaymentResBodyDto> {
    return this.paymentService.getPayment(id);
  }
}
