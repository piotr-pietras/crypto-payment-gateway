import { Module } from '@nestjs/common';
import { BlockService } from './block.service';
import { EtherscanModule } from '../etherscan/etherscan.module';
import { DbModule } from '../db/db.module';
import { AccountModule } from '../account/account.module';
import { InitializerModule } from '../initializer/initializer.module';
import { PaymentModule } from '../payment/payment.module';
import { WSModule } from '../ws/ws.module';
import { BlockController } from './block.controller';

@Module({
  imports: [
    InitializerModule,
    DbModule,
    AccountModule,
    EtherscanModule,
    PaymentModule,
  ],
  controllers: [BlockController],
  providers: [BlockService],
  exports: [BlockService],
})
export class BlockModule {}
