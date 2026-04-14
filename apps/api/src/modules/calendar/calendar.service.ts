import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Booking, CalendarSyncStatus } from '@prisma/client';
import { google } from 'googleapis';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class CalendarService {
  private readonly logger = new Logger(CalendarService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  async upsertBookingEvent(booking: Booking) {
    const connection = await this.prisma.calendarConnection.findFirst();
    if (!connection) {
      await this.prisma.booking.update({
        where: { id: booking.id },
        data: { calendarSyncStatus: CalendarSyncStatus.FAILED },
      });
      return;
    }

    try {
      const oauth2Client = new google.auth.OAuth2(
        this.configService.get<string>('GOOGLE_CLIENT_ID'),
        this.configService.get<string>('GOOGLE_CLIENT_SECRET'),
        this.configService.get<string>('GOOGLE_REDIRECT_URI'),
      );
      oauth2Client.setCredentials({ refresh_token: connection.encryptedRefreshToken });

      const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
      const existing = await this.prisma.calendarEvent.findUnique({ where: { bookingId: booking.id } });

      const eventPayload = {
        summary: `St Agnes Booking ${booking.referenceCode}`,
        description: `Service: ${booking.serviceType}`,
        start: { dateTime: booking.startAtUtc.toISOString() },
        end: { dateTime: booking.endAtUtc.toISOString() },
      };

      if (!existing) {
        const created = await calendar.events.insert({
          calendarId: connection.googleCalendarId,
          requestBody: eventPayload,
        });
        if (created.data.id) {
          await this.prisma.calendarEvent.create({
            data: {
              bookingId: booking.id,
              googleEventId: created.data.id,
              etag: created.data.etag ?? null,
            },
          });
        }
      } else {
        await calendar.events.patch({
          calendarId: connection.googleCalendarId,
          eventId: existing.googleEventId,
          requestBody: eventPayload,
        });
      }

      await this.prisma.booking.update({
        where: { id: booking.id },
        data: { calendarSyncStatus: CalendarSyncStatus.SYNCED },
      });
    } catch (error) {
      this.logger.error('Calendar sync failed', error as Error);
      await this.prisma.booking.update({
        where: { id: booking.id },
        data: { calendarSyncStatus: CalendarSyncStatus.FAILED },
      });
    }
  }
}
