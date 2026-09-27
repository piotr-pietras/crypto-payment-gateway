import { Module } from '@nestjs/common';
import { DbModule } from '../db/db.module';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';
import { InitializerModule } from '../initializer/initializer.module';
import { AccountModule } from '../account/account.module';
import { WSModule } from '../ws/ws.module';
import { EtherscanModule } from '../etherscan/etherscan.module';

@Module({
  imports: [
    InitializerModule,
    DbModule,
    WSModule,
    EtherscanModule,
    AccountModule,
  ],
  controllers: [PaymentController],
  providers: [PaymentService],
  exports: [PaymentService],
})
export class PaymentModule {}
