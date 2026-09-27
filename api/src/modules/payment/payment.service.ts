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
import { AccountService } from '../account/account.service';
import { WSGateway } from '../ws/ws.gateway';
import { EtherscanService } from '../etherscan/etherscan.service';
import { erc20ValueToAmount } from 'src/common/utils/erc20ValueToAmount';

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
    private readonly ws: WSGateway,
    private readonly etherscan: EtherscanService,
    private readonly account: AccountService,
  ) {}

  async getPayment(id: string) {
    const payment = await this.db.payment.findUnique({
      where: {
        id,
      },
    });

    if (!payment) {
      throw new HttpException('Payment not found', HttpStatus.NOT_FOUND);
    }

    return {
      ...payment,
      amount: payment.amount.toString(),
      toAddress: this.account.root.address,
    };
  }

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
        id: body.id,
      },
    });

    if (!payment) {
      throw new HttpException('Payment not found', HttpStatus.NOT_FOUND);
    } else if (!(payment.status === PaymentStatus.CREATED)) {
      throw new HttpException(
        `Payment is not in the correct status: ${payment.status}\n` +
          `The statuses that are allowed are: ${PaymentStatus.CREATED}`,
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
            in: [PaymentStatus.CREATED, PaymentStatus.PENDING],
          },
        },
      })
    ) {
      throw new HttpException('Conflict payment exists', HttpStatus.CONFLICT);
    }

    const updatedPayment = await this.db.payment.update({
      where: {
        id: body.id,
      },
      data: {
        fromAddress: body.fromAddress.toLowerCase(),
        status: PaymentStatus.PENDING,
      },
    });

    return {
      ...updatedPayment,
      amount: updatedPayment.amount.toString(),
      toAddress: this.account.root.address,
    };
  }

  async linkPayment(transferHash: string) {
    const transfer = await this.db.transfer.findUnique({
      where: { hash: transferHash },
    });

    if (!transfer) return;

    const decimals = await this.etherscan.getERC20Decimals(
      transfer.contractAddress,
    );
    const amount = erc20ValueToAmount(transfer.value, decimals);
    const payment = await this.db.payment.findFirst({
      where: {
        amount,
        fromAddress: transfer.fromAddress,
        contractAddress: transfer.contractAddress,
        status: {
          in: [PaymentStatus.PENDING],
        },
        transfer: null,
      },
    });

    if (!payment) return;

    const updatedPayment = await this.db.payment.update({
      where: { id: payment.id },
      data: { transferHash: transfer.hash, status: PaymentStatus.COMPLETED },
    });

    this.ws.emitTransfer(payment.id, updatedPayment);

    console.log(`Payment ${payment.id} linked to transfer ${transfer.hash}`);

    return updatedPayment;
  }
}
