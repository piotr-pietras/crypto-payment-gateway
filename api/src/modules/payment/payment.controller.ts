import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import {
  ApiForbiddenResponse,
  ApiOperation,
  ApiResponse,
  ApiSecurity,
  ApiTags,
} from '@nestjs/swagger';
import { ApiKeyGuard } from 'src/guards/apikey.guard';
import { ErrorDto } from 'src/common/dto';
import {
  AddFromAddressReqBodyDto,
  AddFromAddressResBodyDto,
  CreatePaymentReqBodyDto,
  CreatePaymentResBodyDto,
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
    type: ErrorDto,
  })
  async createPayment(
    @Body() body: CreatePaymentReqBodyDto,
  ): Promise<CreatePaymentResBodyDto> {
    return this.paymentService.createPayment(body);
  }

  @Post('add-from-address')
  @ApiOperation({ summary: 'Add a from address to a payment' })
  @ApiResponse({
    status: 200,
    description: 'From address added successfully',
    type: AddFromAddressResBodyDto,
  })
  async addFromAddress(
    @Body() body: AddFromAddressReqBodyDto,
  ): Promise<AddFromAddressResBodyDto> {
    return this.paymentService.addFromAddress(body);
  }
}
