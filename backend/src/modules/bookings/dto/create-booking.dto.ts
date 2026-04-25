import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ServiceType } from '@prisma/client';

export class RentalItemDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  rentalProductId!: string;

  @ApiPropertyOptional({ example: 'M' })
  @IsOptional()
  @IsString()
  selectedSize?: string;
}

export class CreateBookingDto {
  @ApiProperty({ example: 'Jane Doe' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  clientName!: string;

  @ApiProperty({ example: 'jane@example.com' })
  @IsEmail()
  clientEmail!: string;

  @ApiPropertyOptional({ example: '+234 801 234 5678' })
  @IsOptional()
  @IsString()
  clientPhone?: string;

  @ApiProperty({ enum: ServiceType })
  @IsEnum(ServiceType)
  serviceType!: ServiceType;

  @ApiProperty({ example: '2026-05-10T08:00:00.000Z', description: 'UTC ISO start time. For RENTAL bookings this is the pickup date (start of day).' })
  @IsDateString()
  startTime!: string;

  @ApiPropertyOptional({
    example: '2026-05-12',
    description: 'ISO date string (YYYY-MM-DD) for the rental return date. Required for RENTAL bookings; ignored for other service types.',
  })
  @IsOptional()
  @IsDateString()
  rentalEndDate?: string;

  @ApiPropertyOptional({
    description:
      'Optional notes (reason for visit, preferences, etc.)',
  })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'Special requests for the studio.' })
  @IsOptional()
  @IsString()
  specialRequests?: string;

  @ApiPropertyOptional({
    type: [RentalItemDto],
    description: 'Required when serviceType = RENTAL.',
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => RentalItemDto)
  rentalItems?: RentalItemDto[];

  @ApiProperty({ example: true })
  @IsBoolean()
  termsAccepted!: boolean;

  @ApiProperty({
    format: 'uuid',
    description: 'Must match the currently active TermsVersion id.',
  })
  @IsUUID()
  termsVersionId!: string;
}
