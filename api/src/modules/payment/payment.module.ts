import { Module } from '@nestjs/common';
import { DbModule } from '../db/db.module';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';
import { InitializerModule } from '../initializer/initializer.module';

@Module({
  imports: [InitializerModule, DbModule],
  controllers: [PaymentController],
  providers: [PaymentService],
  exports: [PaymentService],
})
export class PaymentModule {}
