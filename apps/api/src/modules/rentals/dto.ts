import { IsBoolean, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateRentalItemDto {
  @IsString()
  name!: string;

  @IsString()
  description!: string;

  @IsOptional()
  @IsString()
  size?: string;

  @IsNumber()
  @Min(0)
  price!: number;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateRentalItemDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  size?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
