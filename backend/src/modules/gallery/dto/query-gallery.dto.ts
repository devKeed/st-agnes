import { IsBooleanString, IsEnum, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { GalleryCategory } from '@prisma/client';

export class QueryGalleryDto {
  @ApiPropertyOptional({ enum: GalleryCategory })
  @IsOptional()
  @IsEnum(GalleryCategory)
  category?: GalleryCategory;

  @ApiPropertyOptional({
    description: 'Admin-only: when true, includes hidden items in results.',
  })
  @IsOptional()
  @IsBooleanString()
  includeHidden?: string;
}
