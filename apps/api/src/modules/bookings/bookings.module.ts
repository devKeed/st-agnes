import { Module } from '@nestjs/common';
import { BookingsController } from './bookings.controller';
import { BookingsService } from './bookings.service';
import { BookingRepository } from './repositories/booking.repository';
import { PoliciesModule } from '../policies/policies.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { CalendarModule } from '../calendar/calendar.module';

@Module({
  imports: [PoliciesModule, NotificationsModule, CalendarModule],
  controllers: [BookingsController],
  providers: [BookingsService, BookingRepository],
})
export class BookingsModule {}
