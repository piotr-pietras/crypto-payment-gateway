import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { ApiKeyGuard } from 'src/guards/apikey.guard';
import { BlockService } from './block.service';
import { GetTransfersResBodyDto } from './block.dto';
import { GetPaymentResBodyDto } from '../payment/payment.dto';

@ApiTags('block')
@ApiSecurity('x-api-key')
@Controller('block')
export class BlockController {
  constructor(private readonly block: BlockService) {}

  @Get('/transfers')
  @UseGuards(ApiKeyGuard)
  @ApiOperation({ summary: "Get transfers by sender's address" })
  @ApiResponse({
    status: 200,
    description: 'Transfers found',
    type: [GetTransfersResBodyDto],
  })
  async getTransfers(
    @Query('address') address: string,
  ): Promise<GetTransfersResBodyDto[]> {
    return this.block.getTransfers(address);
  }
}
