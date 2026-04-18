import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { google } from 'googleapis';
import * as crypto from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';

const GOOGLE_SCOPES = ['https://www.googleapis.com/auth/calendar'];
const TOKEN_REFRESH_BUFFER_MS = 60_000;

@Injectable()
export class CalendarService {
  private readonly logger = new Logger(CalendarService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ─── OAuth setup ────────────────────────────────────────────────────────────

  getAuthUrl(adminId: string) {
    const oauth = this.createOAuthClient();
    const state = this.signState(adminId);

    const url = oauth.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      include_granted_scopes: true,
      scope: GOOGLE_SCOPES,
      state,
    });

    return { url };
  }

  async handleOAuthCallback(params: {
    code?: string;
    state?: string;
    error?: string;
  }) {
    if (params.error) {
      this.logger.warn(`Google OAuth denied: ${params.error}`);
      return {
        success: false,
        message: `Google authorization failed: ${params.error}`,
      };
    }

    if (!params.code) {
      throw new BadRequestException('Missing OAuth code.');
    }
    if (!params.state) {
      throw new BadRequestException('Missing OAuth state.');
    }

    this.verifyState(params.state);

    const oauth = this.createOAuthClient();
    const { tokens } = await oauth.getToken(params.code);

    if (!tokens.access_token) {
      throw new InternalServerErrorException(
        'Google did not return an access token.',
      );
    }

    const existing = await this.prisma.googleCalendarConfig.findFirst({
      orderBy: { createdAt: 'asc' },
    });

    const calendarId = existing?.calendarId ?? process.env.GOOGLE_CALENDAR_ID ?? 'primary';
    const tokenExpiry = new Date(tokens.expiry_date ?? Date.now() + 55 * 60_000);

    if (existing) {
      await this.prisma.googleCalendarConfig.update({
        where: { id: existing.id },
        data: {
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token ?? existing.refreshToken,
          tokenExpiry,
          calendarId,
        },
      });
    } else {
      if (!tokens.refresh_token) {
        throw new InternalServerErrorException(
          'Google did not return a refresh token. Reconnect with consent prompt.',
        );
      }

      await this.prisma.googleCalendarConfig.create({
        data: {
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          calendarId,
          tokenExpiry,
        },
      });
    }

    this.logger.log('Google Calendar connected successfully.');

    return {
      success: true,
      message: 'Google Calendar connected successfully.',
      calendarId,
    };
  }

  async getStatus() {
    const config = await this.prisma.googleCalendarConfig.findFirst({
      orderBy: { createdAt: 'asc' },
    });

    if (!config) {
      return {
        connected: false,
        calendarId: null,
        tokenExpiry: null,
        hasRefreshToken: false,
      };
    }

    return {
      connected: true,
      calendarId: config.calendarId,
      tokenExpiry: config.tokenExpiry,
      hasRefreshToken: Boolean(config.refreshToken),
    };
  }

  async updateCalendarId(calendarId: string) {
    const normalizedCalendarId = calendarId.trim();
    if (!normalizedCalendarId) {
      throw new BadRequestException('calendarId is required.');
    }

    const config = await this.prisma.googleCalendarConfig.findFirst({
      orderBy: { createdAt: 'asc' },
    });

    if (!config) {
      throw new NotFoundException('Google Calendar is not connected.');
    }

    const ctx = await this.getCalendarContext();
    if (!ctx) {
      throw new NotFoundException('Google Calendar is not connected.');
    }

    try {
      await this.executeCalendarCall(async () =>
        ctx.calendar.calendars.get({ calendarId: normalizedCalendarId }),
      );
    } catch (error) {
      if (this.isGoogleNotFound(error)) {
        throw new BadRequestException(
          'The provided calendarId was not found or is not accessible by this Google account.',
        );
      }
      throw error;
    }

    await this.prisma.googleCalendarConfig.update({
      where: { id: config.id },
      data: { calendarId: normalizedCalendarId },
    });

    return {
      success: true,
      calendarId: normalizedCalendarId,
      message: 'Google Calendar target updated successfully.',
    };
  }

  async disconnect() {
    await this.prisma.googleCalendarConfig.deleteMany({});
    this.logger.log('Google Calendar disconnected.');
    return { success: true };
  }

  // ─── Booking sync ───────────────────────────────────────────────────────────

  syncBookingCreated(bookingId: string) {
    void this.createBookingEvent(bookingId).catch((error: unknown) => {
      this.logger.warn(
        `Calendar booking-create sync failed for ${bookingId}: ${this.errorMessage(error)}`,
      );
    });
  }

  syncBookingRescheduled(bookingId: string) {
    void this.updateBookingEvent(bookingId).catch((error: unknown) => {
      this.logger.warn(
        `Calendar booking-update sync failed for ${bookingId}: ${this.errorMessage(error)}`,
      );
    });
  }

  syncBookingCancelled(bookingId: string) {
    void this.deleteBookingEvent(bookingId).catch((error: unknown) => {
      this.logger.warn(
        `Calendar booking-delete sync failed for ${bookingId}: ${this.errorMessage(error)}`,
      );
    });
  }

  // ─── Blocked date sync ──────────────────────────────────────────────────────

  syncBlockedDateCreated(blockedDateId: string) {
    void this.createBlockedDateEvent(blockedDateId).catch((error: unknown) => {
      this.logger.warn(
        `Calendar blocked-date create sync failed for ${blockedDateId}: ${this.errorMessage(error)}`,
      );
    });
  }

  syncBlockedDateDeleted(googleEventId: string | null | undefined) {
    if (!googleEventId) return;

    void this.deleteEventById(googleEventId).catch((error: unknown) => {
      this.logger.warn(
        `Calendar blocked-date delete sync failed for ${googleEventId}: ${this.errorMessage(error)}`,
      );
    });
  }

  // ─── Internal: booking event handlers ───────────────────────────────────────

  private async createBookingEvent(bookingId: string): Promise<void> {
    const booking = await this.prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking || booking.googleEventId) return;

    const ctx = await this.getCalendarContext();
    if (!ctx) return;

    const event = await this.executeCalendarCall(async () =>
      ctx.calendar.events.insert({
        calendarId: ctx.config.calendarId,
        requestBody: this.buildBookingEventRequestBody(booking),
      }),
    );

    const eventId = event.data.id;
    if (!eventId) return;

    await this.prisma.booking.update({
      where: { id: booking.id },
      data: { googleEventId: eventId },
    });
  }

  private async updateBookingEvent(bookingId: string): Promise<void> {
    const booking = await this.prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking) return;

    if (!booking.googleEventId) {
      await this.createBookingEvent(bookingId);
      return;
    }

    const ctx = await this.getCalendarContext();
    if (!ctx) return;

    try {
      await this.executeCalendarCall(async () =>
        ctx.calendar.events.update({
          calendarId: ctx.config.calendarId,
          eventId: booking.googleEventId!,
          requestBody: this.buildBookingEventRequestBody(booking),
        }),
      );
    } catch (error) {
      if (this.isGoogleNotFound(error)) {
        await this.prisma.booking.update({
          where: { id: booking.id },
          data: { googleEventId: null },
        });
        await this.createBookingEvent(booking.id);
        return;
      }
      throw error;
    }
  }

  private async deleteBookingEvent(bookingId: string): Promise<void> {
    const booking = await this.prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking?.googleEventId) return;

    await this.deleteEventById(booking.googleEventId);

    await this.prisma.booking.update({
      where: { id: booking.id },
      data: { googleEventId: null },
    });
  }

  // ─── Internal: blocked-date event handlers ──────────────────────────────────

  private async createBlockedDateEvent(blockedDateId: string): Promise<void> {
    const blockedDate = await this.prisma.blockedDate.findUnique({
      where: { id: blockedDateId },
    });
    if (!blockedDate || blockedDate.googleEventId) return;

    const ctx = await this.getCalendarContext();
    if (!ctx) return;

    const isFullDay = !blockedDate.startTime || !blockedDate.endTime;
    const reason = blockedDate.reason?.trim() || 'Unavailable';
    const dateStr = blockedDate.date.toISOString().slice(0, 10);

    const requestBody = isFullDay
      ? {
          summary: `BLOCKED - St Agnes (${reason})`,
          description: `Studio blocked date (${dateStr}).`,
          start: { date: dateStr },
          end: { date: this.nextDateStr(dateStr) },
        }
      : {
          summary: `BLOCKED - St Agnes (${reason})`,
          description: `Studio blocked time (${dateStr} ${blockedDate.startTime}-${blockedDate.endTime}).`,
          start: {
            dateTime: this.hhmToUtcIso(dateStr, blockedDate.startTime!),
            timeZone: this.timezone(),
          },
          end: {
            dateTime: this.hhmToUtcIso(dateStr, blockedDate.endTime!),
            timeZone: this.timezone(),
          },
        };

    const event = await this.executeCalendarCall(async () =>
      ctx.calendar.events.insert({
        calendarId: ctx.config.calendarId,
        requestBody,
      }),
    );

    const eventId = event.data.id;
    if (!eventId) return;

    await this.prisma.blockedDate.update({
      where: { id: blockedDate.id },
      data: { googleEventId: eventId },
    });
  }

  private async deleteEventById(eventId: string): Promise<void> {
    const ctx = await this.getCalendarContext();
    if (!ctx) return;

    try {
      await this.executeCalendarCall(async () =>
        ctx.calendar.events.delete({
          calendarId: ctx.config.calendarId,
          eventId,
        }),
      );
    } catch (error) {
      if (!this.isGoogleNotFound(error)) {
        throw error;
      }
    }
  }

  // ─── Internal: Google auth/token refresh ────────────────────────────────────

  private createOAuthClient() {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI;

    if (!clientId || !clientSecret || !redirectUri) {
      throw new InternalServerErrorException(
        'Google OAuth environment variables are not fully configured.',
      );
    }

    return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
  }

  private async getCalendarContext(): Promise<
    | {
        calendar: ReturnType<typeof google.calendar>;
        config: {
          id: string;
          accessToken: string;
          refreshToken: string;
          calendarId: string;
          tokenExpiry: Date;
        };
      }
    | null
  > {
    const config = await this.prisma.googleCalendarConfig.findFirst({
      orderBy: { createdAt: 'asc' },
    });

    if (!config) {
      return null;
    }

    const oauth = this.createOAuthClient();

    let accessToken = config.accessToken;
    let tokenExpiry = config.tokenExpiry;

    const needsRefresh =
      config.tokenExpiry.getTime() <= Date.now() + TOKEN_REFRESH_BUFFER_MS;

    if (needsRefresh) {
      oauth.setCredentials({ refresh_token: config.refreshToken });
      const { credentials } = await oauth.refreshAccessToken();

      accessToken = credentials.access_token ?? config.accessToken;
      tokenExpiry = new Date(credentials.expiry_date ?? Date.now() + 55 * 60_000);

      await this.prisma.googleCalendarConfig.update({
        where: { id: config.id },
        data: {
          accessToken,
          refreshToken: credentials.refresh_token ?? config.refreshToken,
          tokenExpiry,
        },
      });
    }

    oauth.setCredentials({
      access_token: accessToken,
      refresh_token: config.refreshToken,
      expiry_date: tokenExpiry.getTime(),
    });

    const calendar = google.calendar({ version: 'v3', auth: oauth });

    return {
      calendar,
      config: {
        id: config.id,
        accessToken,
        refreshToken: config.refreshToken,
        calendarId: config.calendarId,
        tokenExpiry,
      },
    };
  }

  private async executeCalendarCall<T>(fn: () => Promise<T>): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      if (!this.isGoogleAuthError(error)) {
        throw error;
      }

      // Token may have expired unexpectedly. Force refresh and retry once.
      const config = await this.prisma.googleCalendarConfig.findFirst({
        orderBy: { createdAt: 'asc' },
      });
      if (!config) throw error;

      const oauth = this.createOAuthClient();
      oauth.setCredentials({ refresh_token: config.refreshToken });
      const { credentials } = await oauth.refreshAccessToken();

      await this.prisma.googleCalendarConfig.update({
        where: { id: config.id },
        data: {
          accessToken: credentials.access_token ?? config.accessToken,
          refreshToken: credentials.refresh_token ?? config.refreshToken,
          tokenExpiry: new Date(credentials.expiry_date ?? Date.now() + 55 * 60_000),
        },
      });

      return fn();
    }
  }

  // ─── Internal: helpers ──────────────────────────────────────────────────────

  private buildBookingDescription(booking: {
    id: string;
    clientName: string;
    clientEmail: string;
    clientPhone: string | null;
    notes: string | null;
    specialRequests: string | null;
  }): string {
    return [
      `Booking ID: ${booking.id}`,
      `Client: ${booking.clientName}`,
      `Email: ${booking.clientEmail}`,
      booking.clientPhone ? `Phone: ${booking.clientPhone}` : null,
      booking.notes ? `Notes: ${booking.notes}` : null,
      booking.specialRequests ? `Special Requests: ${booking.specialRequests}` : null,
    ]
      .filter(Boolean)
      .join('\n');
  }

  private buildBookingEventRequestBody(booking: {
    id: string;
    serviceType: string;
    clientName: string;
    clientEmail: string;
    clientPhone: string | null;
    notes: string | null;
    specialRequests: string | null;
    startTime: Date;
    endTime: Date;
  }) {
    return {
      summary: `St Agnes - ${booking.serviceType} (${booking.clientName})`,
      description: this.buildBookingDescription(booking),
      start: {
        dateTime: booking.startTime.toISOString(),
        timeZone: this.timezone(),
      },
      end: {
        dateTime: booking.endTime.toISOString(),
        timeZone: this.timezone(),
      },
      attendees: this.shouldAddClientAsAttendee()
        ? [{ email: booking.clientEmail, displayName: booking.clientName }]
        : undefined,
    };
  }

  private timezone(): string {
    return process.env.TIMEZONE || 'Africa/Lagos';
  }

  private shouldAddClientAsAttendee(): boolean {
    const raw = process.env.GOOGLE_ADD_CLIENT_AS_ATTENDEE;
    if (!raw) return false;

    const normalized = raw.trim().toLowerCase();
    return normalized === 'true' || normalized === '1' || normalized === 'yes';
  }

  private signState(adminId: string): string {
    const secret =
      process.env.GOOGLE_OAUTH_STATE_SECRET ||
      process.env.JWT_SECRET ||
      'calendar-state-secret';
    const payload = `${adminId}:${Date.now()}:${crypto.randomUUID()}`;
    const signature = crypto.createHmac('sha256', secret).update(payload).digest('hex');

    return `${Buffer.from(payload, 'utf8').toString('base64url')}.${Buffer.from(signature, 'utf8').toString('base64url')}`;
  }

  private verifyState(state: string): void {
    const secret =
      process.env.GOOGLE_OAUTH_STATE_SECRET ||
      process.env.JWT_SECRET ||
      'calendar-state-secret';
    const [payloadB64, signatureB64] = state.split('.');
    if (!payloadB64 || !signatureB64) {
      throw new BadRequestException('Invalid OAuth state.');
    }

    const payload = Buffer.from(payloadB64, 'base64url').toString('utf8');
    const signature = Buffer.from(signatureB64, 'base64url').toString('utf8');

    const expected = crypto.createHmac('sha256', secret).update(payload).digest('hex');
    if (signature !== expected) {
      throw new BadRequestException('Invalid OAuth state signature.');
    }

    const parts = payload.split(':');
    const ts = Number(parts[1]);
    if (!Number.isFinite(ts)) {
      throw new BadRequestException('Invalid OAuth state payload.');
    }

    // State expires after 10 minutes
    if (Date.now() - ts > 10 * 60_000) {
      throw new BadRequestException('OAuth state expired. Please try again.');
    }
  }

  private hhmToUtcIso(dateStr: string, hhmm: string): string {
    const [year, month, day] = dateStr.split('-').map(Number);
    const [hour, minute] = hhmm.split(':').map(Number);
    // Lagos (UTC+1): local time minus 1 hour = UTC
    const utc = new Date(Date.UTC(year, month - 1, day, hour - 1, minute, 0));
    return utc.toISOString();
  }

  private nextDateStr(dateStr: string): string {
    const [year, month, day] = dateStr.split('-').map(Number);
    const d = new Date(Date.UTC(year, month - 1, day + 1));
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
  }

  private isGoogleAuthError(error: unknown): boolean {
    const status = (error as { code?: number; response?: { status?: number } })?.code
      ?? (error as { response?: { status?: number } })?.response?.status;
    return status === 401 || status === 403;
  }

  private isGoogleNotFound(error: unknown): boolean {
    const status = (error as { code?: number; response?: { status?: number } })?.code
      ?? (error as { response?: { status?: number } })?.response?.status;
    return status === 404;
  }

  private errorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }
    return 'Unknown error';
  }
}
