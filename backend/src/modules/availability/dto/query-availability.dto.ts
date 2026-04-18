import { IsEnum, IsOptional, IsString, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ServiceType } from '@prisma/client';

export class QueryAvailabilityDto {
  @ApiProperty({
    example: '2026-04',
    description: 'Month to query in YYYY-MM format.',
  })
  @IsString()
  @Matches(/^\d{4}-(0[1-9]|1[0-2])$/, {
    message: 'month must be in YYYY-MM format',
  })
  month!: string;

  @ApiPropertyOptional({
    enum: ServiceType,
    description:
      'Filters slot duration to the configured duration for this service type.',
  })
  @IsOptional()
  @IsEnum(ServiceType)
  service?: ServiceType;
}
