import { IsDateString, IsOptional, IsString, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class BlockDateDto {
  @ApiProperty({
    example: '2026-04-25',
    description: 'Date to block in YYYY-MM-DD format.',
  })
  @IsString()
  @Matches(/^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/, {
    message: 'date must be in YYYY-MM-DD format',
  })
  date!: string;

  @ApiPropertyOptional({
    example: '09:00',
    description:
      'Start of blocked time range in HH:mm (Lagos time). Omit for full-day block.',
  })
  @IsOptional()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, {
    message: 'startTime must be HH:mm',
  })
  startTime?: string;

  @ApiPropertyOptional({
    example: '13:00',
    description: 'End of blocked time range in HH:mm (Lagos time). Required when startTime is provided.',
  })
  @IsOptional()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, {
    message: 'endTime must be HH:mm',
  })
  endTime?: string;

  @ApiPropertyOptional({ example: 'Studio maintenance' })
  @IsOptional()
  @IsString()
  reason?: string;
}
