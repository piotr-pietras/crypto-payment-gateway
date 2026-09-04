import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { timingSafeEqual } from 'node:crypto';
import { EnvironmentVariables } from 'src/modules/env/env.validation';
import { Environment } from 'src/types';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(
    private readonly configService: ConfigService<
      Record<keyof EnvironmentVariables, string>,
      true
    >,
  ) {}

  canActivate(context: ExecutionContext): boolean | Promise<boolean> {
    if (this.configService.get('ENV') === Environment.MAINNET) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const apiKey = request.headers['x-api-key'];

    if (typeof apiKey !== 'string') {
      return false;
    }

    return timingSafeEqual(
      Buffer.from(apiKey, 'utf-8'),
      Buffer.from(this.configService.get('API_KEY')),
    );
  }
}
