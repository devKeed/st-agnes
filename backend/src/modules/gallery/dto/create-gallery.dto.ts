import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  Min,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { GalleryCategory } from '@prisma/client';

export class CreateGalleryDto {
  @ApiProperty({ enum: GalleryCategory })
  @IsEnum(GalleryCategory)
  category!: GalleryCategory;

  @ApiProperty({ example: 'SS26 Look 04' })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  title!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 'https://res.cloudinary.com/.../image/upload/.../look04.jpg' })
  @IsUrl()
  imageUrl!: string;

  @ApiPropertyOptional({
    example: 'st-agnes/gallery/look04',
    description:
      'Cloudinary public ID. Required if you want admin DELETE to clean up the CDN asset.',
  })
  @IsOptional()
  @IsString()
  imagePublicId?: string;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(10_000)
  sortOrder?: number;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isVisible?: boolean;
}
