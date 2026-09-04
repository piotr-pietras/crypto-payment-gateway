import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { DbService } from '../db/db.service';
import {
  AddFromAddressReqBodyDto,
  CreatePaymentReqBodyDto,
} from './payment.dto';
import { ConfigService } from '@nestjs/config';
import { EnvironmentVariables } from '../env/env.validation';
import { PaymentTokenAddresses } from 'src/types';
import { PaymentStatus } from '../db/prisma/enums';

/**
 * Payment service
 *
 * @description This service is responsible for creating and linking payments to transfers
 *
 * Make sure that the any ethereum address is in lowercase not in readable format
 */
@Injectable()
export class PaymentService {
  constructor(
    private readonly env: ConfigService<
      Record<keyof EnvironmentVariables, string>,
      true
    >,
    private readonly db: DbService,
  ) {}

  async createPayment(body: CreatePaymentReqBodyDto) {
    const payment = await this.db.payment.create({
      data: {
        amount: body.amount,
        contractAddress:
          PaymentTokenAddresses[body.paymentToken][
            this.env.get('ENV')
          ].toLowerCase(),
      },
    });

    return {
      id: payment.id,
      url: ``,
    };
  }

  async addFromAddress(body: AddFromAddressReqBodyDto) {
    const payment = await this.db.payment.findUnique({
      where: {
        id: body.paymentId,
      },
    });

    if (!payment) {
      throw new HttpException('Payment not found', HttpStatus.NOT_FOUND);
    } else if (
      !(
        payment.status === PaymentStatus.CREATED ||
        payment.status === PaymentStatus.PENDING
      )
    ) {
      throw new HttpException(
        `Payment is not in the correct status: ${payment.status}\n` +
          `The statuses that are allowed are: ${PaymentStatus.CREATED} and ${PaymentStatus.PENDING}`,
        HttpStatus.BAD_REQUEST,
      );
    } else if (
      await this.db.payment.findFirst({
        where: {
          id: {
            not: payment.id,
          },
          fromAddress: body.fromAddress.toLowerCase(),
          contractAddress: payment.contractAddress?.toLowerCase(),
          amount: payment.amount,
          status: {
            in: [PaymentStatus.PENDING, PaymentStatus.CREATED],
          },
        },
      })
    ) {
      throw new HttpException('Conflict payment exists', HttpStatus.CONFLICT);
    }

    const updatedPayment = await this.db.payment.update({
      where: {
        id: body.paymentId,
      },
      data: {
        fromAddress: body.fromAddress.toLowerCase(),
        status: PaymentStatus.PENDING,
      },
    });

    return {
      ...updatedPayment,
      amount: updatedPayment.amount.toString(),
    };
  }

  async linkPayment(transferHash: string) {
    const transfer = await this.db.transfer.findUnique({
      where: { hash: transferHash },
    });

    if (!transfer) return;

    const payment = await this.db.payment.findFirst({
      where: {
        amount: transfer.amount,
        fromAddress: transfer.fromAddress,
        contractAddress: transfer.contractAddress,
        transfer: null,
      },
    });

    if (!payment) return;

    const updatedPayment = await this.db.payment.update({
      where: { id: payment.id },
      data: { transferHash: transfer.hash, status: PaymentStatus.COMPLETED },
    });

    console.log(`Payment ${payment.id} linked to transfer ${transfer.hash}`);

    return updatedPayment;
  }
}
