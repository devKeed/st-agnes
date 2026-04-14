import { ArrayMaxSize, IsArray, IsDateString, IsOptional, IsString } from 'class-validator';

export class CheckAvailabilityDto {
  @IsDateString()
  dateFrom!: string;

  @IsDateString()
  dateTo!: string;

  @IsOptional()
  @IsString()
  timezone?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(5)
  @IsString({ each: true })
  rentalItemIds?: string[];
}
