import { Module } from '@nestjs/common';
import { AvailabilityModule } from '../availability/availability.module';
import { CalendarModule } from '../calendar/calendar.module';
import { EmailModule } from '../email/email.module';
import { BookingsController } from './bookings.controller';
import { BookingsService } from './bookings.service';

@Module({
  imports: [AvailabilityModule, CalendarModule, EmailModule],
  controllers: [BookingsController],
  providers: [BookingsService],
  exports: [BookingsService],
})
export class BookingsModule {}
