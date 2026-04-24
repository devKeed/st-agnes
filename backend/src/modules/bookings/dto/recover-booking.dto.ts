import { IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RecoverBookingDto {
  @ApiProperty({ example: 'jane@example.com' })
  @IsEmail()
  email!: string;
}
