import { plainToInstance } from 'class-transformer';
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  validateSync,
} from 'class-validator';
import { Mnemonic } from 'ethers';
import { Environment } from 'src/types';

export class EnvironmentVariables {
  @IsEnum(Environment)
  ENV: Environment;

  @IsString()
  PHRASE: string;

  @IsString()
  @IsOptional()
  API_KEY: string;

  @IsString()
  ETHERSCAN_API_KEY: string;

  @IsNumber()
  PORT: number;

  @IsNumber()
  INIT_TX_SYNC_BLOCK_BATCH_SIZE: number;

  @IsNumber()
  INIT_BACKWARD_TX_SYNC_BLOCK_QUANTITY: number;

  @IsNumber()
  ETH_BLOCK_INTERVAL: number;
}

export function validate(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });
  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    for (const error of errors) {
      console.error(error.toString());
    }
    throw new Error('Invalid environment variables');
  }

  if (validatedConfig.ENV === Environment.MAINNET && !validatedConfig.API_KEY) {
    throw new Error('API_KEY is required for production environment');
  }

  if (!Mnemonic.isValidMnemonic(validatedConfig.PHRASE)) {
    throw new Error('Mnemonic phrase is invalid');
  }
  return validatedConfig;
}
