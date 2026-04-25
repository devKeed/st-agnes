import { IsBooleanString, IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { RentalStatus } from '@prisma/client';
import { PaginationDto } from '../../../common/dto';

export class QueryRentalsDto extends PaginationDto {
  @ApiPropertyOptional({ enum: RentalStatus })
  @IsOptional()
  @IsEnum(RentalStatus)
  status?: RentalStatus;

  @ApiPropertyOptional({
    description: 'Admin-only: when true, includes hidden items in results.',
  })
  @IsOptional()
  @IsBooleanString()
  includeHidden?: string;

  @ApiPropertyOptional({ description: 'Free-text match on name (case-insensitive).' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'ISO date-time. When provided, annotates results with availableCount for this time window.',
  })
  @IsOptional()
  @IsDateString()
  startTime?: string;

  @ApiPropertyOptional({
    description:
      'ISO date-time. Optional range end for availability calculation. When provided with startTime, availability is computed across the full range overlap.',
  })
  @IsOptional()
  @IsDateString()
  endTime?: string;
}
