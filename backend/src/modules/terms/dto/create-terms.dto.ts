import { IsBoolean, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTermsDto {
  @ApiProperty({ example: 'v1.1' })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  versionLabel!: string;

  @ApiProperty({ example: 'These terms govern the rental of items from St Agnes...' })
  @IsString()
  @IsNotEmpty()
  @MinLength(20)
  content!: string;

  @ApiPropertyOptional({
    default: false,
    description:
      'If true, deactivates all other versions and activates this one immediately on create.',
  })
  @IsOptional()
  @IsBoolean()
  activate?: boolean;
}
