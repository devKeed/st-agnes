import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Matches } from 'class-validator';

export class QueryBlockedDatesDto {
  @ApiPropertyOptional({
    example: '2026-04',
    description:
      'Optional month filter in YYYY-MM format. If omitted, returns all blocked entries.',
  })
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-(0[1-9]|1[0-2])$/, {
    message: 'month must be in YYYY-MM format',
  })
  month?: string;
}
