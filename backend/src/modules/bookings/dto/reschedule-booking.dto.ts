import { IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RescheduleBookingDto {
  @ApiProperty({
    example: '2026-05-15T08:00:00.000Z',
    description: 'New UTC ISO start time.',
  })
  @IsDateString()
  startTime!: string;
}
