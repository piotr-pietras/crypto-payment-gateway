import { Injectable } from '@nestjs/common';
import { HDNodeWallet } from 'ethers';

import { ConfigService } from '@nestjs/config';
import { EnvironmentVariables } from '../env/env.validation';

@Injectable()
export class AccountService {
  readonly root: HDNodeWallet;

  constructor(
    private readonly env: ConfigService<
      Record<keyof EnvironmentVariables, string>,
      true
    >,
  ) {
    this.root = HDNodeWallet.fromPhrase(
      this.env.get('PHRASE'),
      undefined,
      "m/44'/60'/0'/0/0",
    );
  }
}
