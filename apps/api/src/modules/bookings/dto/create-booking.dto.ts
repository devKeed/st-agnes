import {
  ArrayMaxSize,
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsDateString,
  IsEmail,
  IsEnum,
  IsOptional,
  IsPhoneNumber,
  IsString,
  MaxLength,
} from 'class-validator';
import { ServiceType } from '@prisma/client';

export class CreateBookingDto {
  @IsEnum(ServiceType)
  serviceType!: ServiceType;

  @IsString()
  @MaxLength(120)
  clientName!: string;

  @IsEmail()
  clientEmail!: string;

  @IsString()
  clientPhone!: string;

  @IsDateString()
  startAt!: string;

  @IsDateString()
  endAt!: string;

  @IsString()
  timezone!: string;

  @IsArray()
  @ArrayNotEmpty()
  @ArrayMaxSize(5)
  @IsString({ each: true })
  rentalItemIds!: string[];

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  specialRequests?: string;

  @IsBoolean()
  acceptTerms!: boolean;

  @IsBoolean()
  acceptPrivacy!: boolean;
}
