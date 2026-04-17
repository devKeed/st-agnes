import { IsEmail, IsNotEmpty, IsString, MinLength, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AdminRole } from '@prisma/client';

export class CreateAdminDto {
  @ApiProperty({ example: 'admin@stagnes.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @ApiProperty({ example: 'Admin User' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ enum: AdminRole, default: AdminRole.ADMIN })
  @IsOptional()
  @IsEnum(AdminRole)
  role?: AdminRole = AdminRole.ADMIN;
}
