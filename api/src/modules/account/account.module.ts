import { Module } from '@nestjs/common';
import { AccountService } from './account.service';

@Module({
  imports: [],
  controllers: [],
  providers: [AccountService],
  exports: [AccountService],
})
export class AccountModule {}
