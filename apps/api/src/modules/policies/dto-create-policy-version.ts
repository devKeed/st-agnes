import { IsBoolean, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { PolicyType } from '@prisma/client';

export class CreatePolicyVersionDto {
  @IsEnum(PolicyType)
  type!: PolicyType;

  @IsString()
  @MinLength(10)
  contentMarkdown!: string;

  @IsOptional()
  @IsBoolean()
  activate?: boolean;
}
