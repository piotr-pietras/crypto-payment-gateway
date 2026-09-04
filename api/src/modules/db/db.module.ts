import { Module } from '@nestjs/common';
import { DbService } from './db.service';

@Module({
  controllers: [],
  providers: [DbService],
  exports: [DbService],
})
export class DbModule {}
