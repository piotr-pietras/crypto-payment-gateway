import { Injectable } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from './prisma/client';

@Injectable()
export class DbService extends PrismaClient {
  constructor() {
    const adapter = new PrismaPg({
      connectionString:
        process.env.DATABASE_URL ??
        'postgres://postgres:postgres@db:5432/crypto_payment_gateway',
    });
    super({ adapter });
  }
}
