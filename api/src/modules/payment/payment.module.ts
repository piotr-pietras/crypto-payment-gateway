import { Module } from '@nestjs/common';
import { DbModule } from '../db/db.module';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';
import { InitializerModule } from '../initializer/initializer.module';
import { AccountModule } from '../account/account.module';

@Module({
  imports: [InitializerModule, DbModule, AccountModule],
  controllers: [PaymentController],
  providers: [PaymentService],
  exports: [PaymentService],
})
export class PaymentModule {}
