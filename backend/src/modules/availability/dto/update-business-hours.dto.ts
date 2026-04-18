import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsInt,
  IsString,
  Matches,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class BusinessHoursRowDto {
  @ApiProperty({ example: 1, description: '0=Sunday … 6=Saturday' })
  @IsInt()
  @Min(0)
  @Max(6)
  dayOfWeek!: number;

  @ApiProperty({ example: '09:00' })
  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, { message: 'openTime must be HH:mm' })
  openTime!: string;

  @ApiProperty({ example: '17:00' })
  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, { message: 'closeTime must be HH:mm' })
  closeTime!: string;

  @ApiProperty({ example: false })
  @IsBoolean()
  isClosed!: boolean;
}

export class UpdateBusinessHoursDto {
  @ApiProperty({ type: [BusinessHoursRowDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(7)
  @ValidateNested({ each: true })
  @Type(() => BusinessHoursRowDto)
  hours!: BusinessHoursRowDto[];
}
