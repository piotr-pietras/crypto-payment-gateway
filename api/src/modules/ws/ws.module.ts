import { Module } from '@nestjs/common';
import { WSGateway } from './ws.gateway.js';

@Module({
  providers: [WSGateway],
  exports: [WSGateway],
})
export class WSModule {}
