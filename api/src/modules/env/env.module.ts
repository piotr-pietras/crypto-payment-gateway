import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EnvironmentVariables, validate } from './env.validation';

@Module({
  imports: [
    ConfigModule.forRoot<Record<keyof EnvironmentVariables, unknown>>({
      isGlobal: true,
      validate,
    }),
  ],
  exports: [ConfigModule],
})
export class EnvModule {}
