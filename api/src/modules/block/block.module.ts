import { Module } from '@nestjs/common';
import { BlockService } from './block.service';
import { EtherscanModule } from '../etherscan/etherscan.module';
import { DbModule } from '../db/db.module';
import { AccountModule } from '../account/account.module';
import { InitializerModule } from '../initializer/initializer.module';
import { PaymentModule } from '../payment/payment.module';
import { WSModule } from '../ws/ws.module';

@Module({
  imports: [
    InitializerModule,
    DbModule,
    WSModule,
    AccountModule,
    EtherscanModule,
    PaymentModule,
  ],
  providers: [BlockService],
  exports: [BlockService],
})
export class BlockModule {}
