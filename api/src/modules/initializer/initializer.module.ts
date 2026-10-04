import { Module } from '@nestjs/common';
import { AccountModule } from '../account/account.module';
import { InitializerService } from './initializer.service';
import { DbModule } from '../db/db.module';
import { EtherscanModule } from '../etherscan/etherscan.module';
import { PaymentModule } from '../payment/payment.module';

@Module({
  imports: [DbModule, AccountModule, EtherscanModule, PaymentModule],
  controllers: [],
  providers: [InitializerService],
  exports: [InitializerService],
})
export class InitializerModule {}
