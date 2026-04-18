import { IsBooleanString, IsEnum, IsOptional, IsString } from 'class-validator';
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
}
