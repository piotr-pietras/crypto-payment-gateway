import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { EnvModule } from './modules/env/env.module';
import { DbModule } from './modules/db/db.module';
import { AccountModule } from './modules/account/account.module';
import { EtherscanModule } from './modules/etherscan/etherscan.module';
import { InitializerModule } from './modules/initializer/initializer.module';
import { BlockModule } from './modules/block/block.module';
import { PaymentModule } from './modules/payment/payment.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    EnvModule,
    InitializerModule,
    DbModule,
    EtherscanModule,
    AccountModule,
    BlockModule,
    PaymentModule,
  ],
})
export class AppModule {}
