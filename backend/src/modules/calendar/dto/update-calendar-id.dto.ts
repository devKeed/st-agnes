import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateCalendarIdDto {
  @ApiProperty({
    example: 'primary',
    description:
      'Target Google Calendar ID (e.g. "primary" or calendar email address).',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(512)
  calendarId!: string;
}
