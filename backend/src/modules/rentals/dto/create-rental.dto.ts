import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  Min,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RentalStatus } from '@prisma/client';

export class CreateRentalDto {
  @ApiProperty({ example: 'Emerald Silk Gown' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  name!: string;

  @ApiPropertyOptional({ example: 'Hand-stitched emerald silk evening gown.' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: ['XS', 'S', 'M', 'L'], type: [String] })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(20)
  @IsString({ each: true })
  sizes!: string[];

  @ApiProperty({ example: 25000 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  pricePerDay!: number;

  @ApiPropertyOptional({ example: 50000, default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  depositAmount?: number;

  @ApiProperty({
    example: ['https://res.cloudinary.com/.../image/upload/.../abc.jpg'],
    type: [String],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(10)
  @IsUrl({ require_tld: false }, { each: true })
  imageUrls!: string[];

  @ApiProperty({
    example: ['st-agnes/rentals/abc'],
    type: [String],
    description:
      'Cloudinary public IDs matching imageUrls by index (required for deletion from CDN on update/remove).',
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(10)
  @IsString({ each: true })
  imagePublicIds!: string[];

  @ApiPropertyOptional({ enum: RentalStatus, default: RentalStatus.AVAILABLE })
  @IsOptional()
  @IsEnum(RentalStatus)
  status?: RentalStatus;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isVisible?: boolean;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(10_000)
  sortOrder?: number;
}
