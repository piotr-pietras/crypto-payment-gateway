import { HttpStatus } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';

export class ErrorDto {
  @ApiProperty({
    description: 'HTTP status code',
    example: HttpStatus.INTERNAL_SERVER_ERROR,
  })
  statusCode: number;

  @ApiProperty({
    description: 'Error type',
    example: 'Internal Server Error',
  })
  error: string;

  @ApiProperty({
    description: 'Error message',
    example: 'fetch failed',
    required: false,
  })
  message?: string;
}
