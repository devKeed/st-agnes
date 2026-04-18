import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UploadModule } from './modules/upload/upload.module';
import { RentalsModule } from './modules/rentals/rentals.module';
import { GalleryModule } from './modules/gallery/gallery.module';
import { ContentModule } from './modules/content/content.module';
import { TermsModule } from './modules/terms/terms.module';
import { AvailabilityModule } from './modules/availability/availability.module';
import { BookingsModule } from './modules/bookings/bookings.module';
import { CalendarModule } from './modules/calendar/calendar.module';
import { EmailModule } from './modules/email/email.module';
import { JwtAuthGuard, RolesGuard } from './common/guards';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, cache: true }),
    ScheduleModule.forRoot(),
    PrismaModule,
    AuthModule,
    UploadModule,
    RentalsModule,
    GalleryModule,
    ContentModule,
    TermsModule,
    AvailabilityModule,
    BookingsModule,
    CalendarModule,
    EmailModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
