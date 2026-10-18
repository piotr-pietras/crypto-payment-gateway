import { ApiProperty } from '@nestjs/swagger';
import { Transfer, TransferStatus } from '../db/prisma/client';

export class GetTransfersResBodyDto
  implements
    Pick<Transfer, 'hash' | 'createdAt' | 'contractAddress' | 'fromAddress'>
{
  @ApiProperty({ example: '0x1234567890123456789012345678901234567890' })
  hash: string;

  @ApiProperty({ example: '100' })
  blockNumber: string;

  @ApiProperty({ example: '2021-01-01' })
  createdAt: Date;

  @ApiProperty({ example: '100' })
  value: string;

  @ApiProperty({ example: '0x1234567890123456789012345678901234567890' })
  contractAddress: string;

  @ApiProperty({ example: '0x1234567890123456789012345678901234567890' })
  fromAddress: string;
}
