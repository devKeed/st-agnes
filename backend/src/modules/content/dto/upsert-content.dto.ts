import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ContentType } from '@prisma/client';

export class UpsertContentDto {
  @ApiProperty({ example: 'Hand-stitched in Lagos.' })
  @IsString()
  @IsNotEmpty()
  value!: string;

  @ApiPropertyOptional({ enum: ContentType, default: ContentType.TEXT })
  @IsOptional()
  @IsEnum(ContentType)
  contentType?: ContentType;
}
