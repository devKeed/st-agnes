import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from './common/prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { BookingsModule } from './modules/bookings/bookings.module';
import { RentalsModule } from './modules/rentals/rentals.module';
import { PoliciesModule } from './modules/policies/policies.module';
import { CalendarModule } from './modules/calendar/calendar.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { AppController } from './app.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    PrismaModule,
    AuthModule,
    BookingsModule,
    RentalsModule,
    PoliciesModule,
    CalendarModule,
    NotificationsModule,
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
