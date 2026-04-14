import { IsDateString, IsOptional, IsString } from 'class-validator';

export class SelfServiceActionDto {
  @IsString()
  token!: string;
}

export class RescheduleBookingDto extends SelfServiceActionDto {
  @IsDateString()
  newStartAt!: string;

  @IsDateString()
  newEndAt!: string;

  @IsOptional()
  @IsString()
  timezone?: string;
}
