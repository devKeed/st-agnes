import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BlockedDate, Booking, GoogleCalendarConfig } from '@prisma/client';
import { google } from 'googleapis';
import { PrismaService } from '../../prisma/prisma.service';

const GOOGLE_CALENDAR_SCOPE = 'https://www.googleapis.com/auth/calendar';
const DEFAULT_CALENDAR_ID = 'primary';
const LAGOS_TIMEZONE = 'Africa/Lagos';

@Injectable()
export class CalendarService {
  private readonly logger = new Logger(CalendarService.name);
  private readonly maxSyncRetries = 3;
  private readonly retryState = new Map<string, number>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async getAuthUrl(calendarId?: string) {
    const oauth2Client = this.createOAuthClient();
    const requestedCalendarId = calendarId || DEFAULT_CALENDAR_ID;

    const statePayload = Buffer.from(
      JSON.stringify({
        calendarId: requestedCalendarId,
        ts: Date.now(),
      }),
      'utf8',
    ).toString('base64url');

    const url = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      scope: [GOOGLE_CALENDAR_SCOPE],
      state: statePayload,
    });

    return { url, calendarId: requestedCalendarId };
  }

  async handleOAuthCallback(code: string, state?: string) {
    const oauth2Client = this.createOAuthClient();
    const { tokens } = await oauth2Client.getToken(code);

    if (!tokens.access_token) {
      throw new InternalServerErrorException(
        'Google did not return an access token.',
      );
    }

    const existing = await this.prisma.googleCalendarConfig.findFirst({
      orderBy: { createdAt: 'asc' },
    });

    const requestedCalendarId = this.parseCalendarIdFromState(state);

    const refreshToken = tokens.refresh_token || existing?.refreshToken;
    if (!refreshToken) {
      throw new InternalServerErrorException(
        'Google did not return a refresh token. Reconnect with consent prompt.',
      );
    }

    const tokenExpiry = tokens.expiry_date
      ? new Date(tokens.expiry_date)
      : new Date(Date.now() + 55 * 60 * 1000);

    const payload = {
      accessToken: tokens.access_token,
      refreshToken,
      calendarId: requestedCalendarId,
      tokenExpiry,
    };

    let config: GoogleCalendarConfig;
    if (existing) {
      config = await this.prisma.googleCalendarConfig.update({
        where: { id: existing.id },
        data: payload,
      });
    } else {
      config = await this.prisma.googleCalendarConfig.create({ data: payload });
    }

    return {
      calendarId: config.calendarId,
      connectedAt: config.updatedAt,
      tokenExpiry: config.tokenExpiry,
    };
  }

  async getStatus() {
    const config = await this.prisma.googleCalendarConfig.findFirst({
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        calendarId: true,
        tokenExpiry: true,
        refreshToken: true,
        updatedAt: true,
      },
    });

    if (!config) {
      return {
        connected: false,
        calendarId: null,
        tokenExpiry: null,
        hasRefreshToken: false,
        updatedAt: null,
      };
    }

    return {
      connected: true,
      calendarId: config.calendarId,
      tokenExpiry: config.tokenExpiry,
      hasRefreshToken: Boolean(config.refreshToken),
      updatedAt: config.updatedAt,
    };
  }

  async disconnect() {
    const deleted = await this.prisma.googleCalendarConfig.deleteMany({});
    return {
      disconnected: true,
      removedConfigs: deleted.count,
    };
  }

  syncBookingCreated(bookingId: string): void {
    const key = `booking-create:${bookingId}`;
    void this.runWithRetry(key, async () => {
      const booking = await this.prisma.booking.findUnique({ where: { id: bookingId } });
      if (!booking) {
        throw new NotFoundException(`Booking ${bookingId} not found for sync.`);
      }

      if (booking.googleEventId) {
        return;
      }

      const calendar = await this.getCalendarClientIfConnected();
      if (!calendar) {
        this.logger.warn('Google Calendar is not connected. Skipping event creation.');
        return;
      }

      const inserted = await calendar.client.events.insert({
        calendarId: calendar.calendarId,
        requestBody: this.buildBookingEventRequest(booking),
      });

      const eventId = inserted.data.id;
      if (!eventId) {
        throw new InternalServerErrorException('Google did not return event id.');
      }

      await this.prisma.booking.update({
        where: { id: booking.id },
        data: { googleEventId: eventId },
      });
    });
  }

  syncBookingRescheduled(bookingId: string): void {
    const key = `booking-reschedule:${bookingId}`;
    void this.runWithRetry(key, async () => {
      const booking = await this.prisma.booking.findUnique({ where: { id: bookingId } });
      if (!booking) {
        throw new NotFoundException(`Booking ${bookingId} not found for sync.`);
      }

      if (!booking.googleEventId) {
        this.syncBookingCreated(bookingId);
        return;
      }

      const calendar = await this.getCalendarClientIfConnected();
      if (!calendar) {
        this.logger.warn('Google Calendar is not connected. Skipping event update.');
        return;
      }

      await calendar.client.events.update({
        calendarId: calendar.calendarId,
        eventId: booking.googleEventId,
        requestBody: this.buildBookingEventRequest(booking),
      });
    });
  }

  syncBookingCancelled(bookingId: string): void {
    const key = `booking-cancel:${bookingId}`;
    void this.runWithRetry(key, async () => {
      const booking = await this.prisma.booking.findUnique({ where: { id: bookingId } });
      if (!booking) {
        throw new NotFoundException(`Booking ${bookingId} not found for sync.`);
      }

      if (!booking.googleEventId) {
        return;
      }

      const calendar = await this.getCalendarClientIfConnected();
      if (!calendar) {
        this.logger.warn('Google Calendar is not connected. Skipping event deletion.');
        return;
      }

      try {
        await calendar.client.events.delete({
          calendarId: calendar.calendarId,
          eventId: booking.googleEventId,
        });
      } catch (error) {
        if (this.isGoogleNotFoundError(error)) {
          this.logger.warn(
            `Google event ${booking.googleEventId} already deleted. Clearing local reference.`,
          );
        } else {
          throw error;
        }
      }

      await this.prisma.booking.update({
        where: { id: booking.id },
        data: { googleEventId: null },
      });
    });
  }

  syncBlockedDateCreated(blockedDateId: string): void {
    const key = `blocked-date-create:${blockedDateId}`;
    void this.runWithRetry(key, async () => {
      const blockedDate = await this.prisma.blockedDate.findUnique({
        where: { id: blockedDateId },
      });

      if (!blockedDate) {
        throw new NotFoundException(
          `Blocked date ${blockedDateId} not found for sync.`,
        );
      }

      if (blockedDate.googleEventId) {
        return;
      }

      const calendar = await this.getCalendarClientIfConnected();
      if (!calendar) {
        this.logger.warn(
          'Google Calendar is not connected. Skipping blocked date event creation.',
        );
        return;
      }

      const inserted = await calendar.client.events.insert({
        calendarId: calendar.calendarId,
        requestBody: this.buildBlockedDateRequest(blockedDate),
      });

      const eventId = inserted.data.id;
      if (!eventId) {
        throw new InternalServerErrorException('Google did not return event id.');
      }

      await this.prisma.blockedDate.update({
        where: { id: blockedDate.id },
        data: { googleEventId: eventId },
      });
    });
  }

  syncBlockedDateRemoved(googleEventId: string | null | undefined): void {
    if (!googleEventId) {
      return;
    }

    const key = `blocked-date-delete:${googleEventId}`;
    void this.runWithRetry(key, async () => {
      const calendar = await this.getCalendarClientIfConnected();
      if (!calendar) {
        this.logger.warn(
          'Google Calendar is not connected. Skipping blocked date event deletion.',
        );
        return;
      }

      try {
        await calendar.client.events.delete({
          calendarId: calendar.calendarId,
          eventId: googleEventId,
        });
      } catch (error) {
        if (!this.isGoogleNotFoundError(error)) {
          throw error;
        }
      }
    });
  }

  private createOAuthClient() {
    const clientId = this.configService.get<string>('GOOGLE_CLIENT_ID');
    const clientSecret = this.configService.get<string>('GOOGLE_CLIENT_SECRET');
    const redirectUri = this.configService.get<string>('GOOGLE_REDIRECT_URI');

    if (!clientId || !clientSecret || !redirectUri) {
      throw new InternalServerErrorException(
        'Google OAuth env vars are missing (GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI).',
      );
    }

    return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
  }

  private parseCalendarIdFromState(state?: string): string {
    if (!state) {
      return DEFAULT_CALENDAR_ID;
    }

    try {
      const decoded = Buffer.from(state, 'base64url').toString('utf8');
      const parsed = JSON.parse(decoded) as { calendarId?: unknown };
      if (typeof parsed.calendarId === 'string' && parsed.calendarId.trim()) {
        return parsed.calendarId.trim();
      }
      return DEFAULT_CALENDAR_ID;
    } catch {
      return DEFAULT_CALENDAR_ID;
    }
  }

  private async getCalendarClientIfConnected(): Promise<{
    client: ReturnType<typeof google.calendar>;
    calendarId: string;
  } | null> {
    const config = await this.prisma.googleCalendarConfig.findFirst({
      orderBy: { createdAt: 'asc' },
    });

    if (!config) {
      return null;
    }

    const oauth2Client = this.createOAuthClient();
    oauth2Client.setCredentials({
      access_token: config.accessToken,
      refresh_token: config.refreshToken,
      expiry_date: config.tokenExpiry.getTime(),
    });

    const refreshed = await this.refreshIfNeeded(config, oauth2Client);

    const client = google.calendar({ version: 'v3', auth: oauth2Client });
    return {
      client,
      calendarId: refreshed.calendarId,
    };
  }

  private async refreshIfNeeded(
    config: GoogleCalendarConfig,
    oauth2Client: InstanceType<typeof google.auth.OAuth2>,
  ): Promise<GoogleCalendarConfig> {
    const bufferMs = 60_000;
    if (config.tokenExpiry.getTime() - Date.now() > bufferMs) {
      return config;
    }

    const { credentials } = await oauth2Client.refreshAccessToken();
    if (!credentials.access_token) {
      throw new InternalServerErrorException(
        'Unable to refresh Google access token.',
      );
    }

    const updated = await this.prisma.googleCalendarConfig.update({
      where: { id: config.id },
      data: {
        accessToken: credentials.access_token,
        refreshToken: credentials.refresh_token || config.refreshToken,
        tokenExpiry: credentials.expiry_date
          ? new Date(credentials.expiry_date)
          : new Date(Date.now() + 55 * 60 * 1000),
      },
    });

    oauth2Client.setCredentials({
      access_token: updated.accessToken,
      refresh_token: updated.refreshToken,
      expiry_date: updated.tokenExpiry.getTime(),
    });

    this.logger.log('Google Calendar access token refreshed successfully.');
    return updated;
  }

  private buildBookingEventRequest(booking: Booking) {
    const summary = `St Agnes Booking - ${booking.serviceType}`;

    const descriptionParts = [
      `Client: ${booking.clientName}`,
      `Email: ${booking.clientEmail}`,
      booking.clientPhone ? `Phone: ${booking.clientPhone}` : undefined,
      booking.notes ? `Notes: ${booking.notes}` : undefined,
      booking.specialRequests
        ? `Special requests: ${booking.specialRequests}`
        : undefined,
      `Booking ID: ${booking.id}`,
    ].filter(Boolean);

    return {
      summary,
      description: descriptionParts.join('\n'),
      start: {
        dateTime: booking.startTime.toISOString(),
        timeZone: LAGOS_TIMEZONE,
      },
      end: {
        dateTime: booking.endTime.toISOString(),
        timeZone: LAGOS_TIMEZONE,
      },
      attendees: booking.clientEmail ? [{ email: booking.clientEmail }] : undefined,
      extendedProperties: {
        private: {
          bookingId: booking.id,
          source: 'st-agnes-backend',
        },
      },
    };
  }

  private buildBlockedDateRequest(blockedDate: BlockedDate) {
    const dateStr = this.dateToYmd(blockedDate.date);
    const summary = 'BLOCKED - St Agnes';
    const description = [
      blockedDate.reason ? `Reason: ${blockedDate.reason}` : undefined,
      `Blocked date ID: ${blockedDate.id}`,
    ]
      .filter(Boolean)
      .join('\n');

    if (!blockedDate.startTime || !blockedDate.endTime) {
      const nextDate = this.dateToYmd(
        new Date(blockedDate.date.getTime() + 24 * 60 * 60 * 1000),
      );

      return {
        summary,
        description,
        start: { date: dateStr, timeZone: LAGOS_TIMEZONE },
        end: { date: nextDate, timeZone: LAGOS_TIMEZONE },
      };
    }

    const start = this.lagosHhmToUtc(blockedDate.date, blockedDate.startTime);
    const end = this.lagosHhmToUtc(blockedDate.date, blockedDate.endTime);

    return {
      summary,
      description,
      start: {
        dateTime: start.toISOString(),
        timeZone: LAGOS_TIMEZONE,
      },
      end: {
        dateTime: end.toISOString(),
        timeZone: LAGOS_TIMEZONE,
      },
    };
  }

  private dateToYmd(date: Date): string {
    return date.toISOString().slice(0, 10);
  }

  private lagosHhmToUtc(date: Date, hhMm: string): Date {
    const [hours, minutes] = hhMm.split(':').map(Number);
    return new Date(
      date.getTime() + hours * 3_600_000 + minutes * 60_000 - 60 * 60_000,
    );
  }

  private isGoogleNotFoundError(error: unknown): boolean {
    if (!error || typeof error !== 'object') {
      return false;
    }

    const maybeResponse = (error as { response?: { status?: number } }).response;
    return maybeResponse?.status === 404;
  }

  private async runWithRetry(
    key: string,
    operation: () => Promise<void>,
    attempt = 1,
  ): Promise<void> {
    if (attempt === 1 && this.retryState.has(key)) {
      this.logger.debug(`Sync already queued/running for ${key}`);
      return;
    }

    this.retryState.set(key, attempt);

    try {
      await operation();
      this.retryState.delete(key);
    } catch (error) {
      if (attempt >= this.maxSyncRetries) {
        this.retryState.delete(key);
        this.logger.error(
          `Calendar sync failed after ${attempt} attempts for ${key}`,
          error instanceof Error ? error.stack : String(error),
        );
        return;
      }

      const nextAttempt = attempt + 1;
      const delayMs = Math.min(60_000, 5_000 * 2 ** (attempt - 1));
      this.logger.warn(
        `Calendar sync failed for ${key}. Retrying in ${delayMs}ms (attempt ${nextAttempt}/${this.maxSyncRetries}).`,
      );

      setTimeout(() => {
        void this.runWithRetry(key, operation, nextAttempt);
      }, delayMs);
    }
  }
}
