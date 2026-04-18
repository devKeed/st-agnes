"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var CalendarService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CalendarService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const googleapis_1 = require("googleapis");
const prisma_service_1 = require("../../prisma/prisma.service");
const GOOGLE_CALENDAR_SCOPE = 'https://www.googleapis.com/auth/calendar';
const DEFAULT_CALENDAR_ID = 'primary';
const LAGOS_TIMEZONE = 'Africa/Lagos';
let CalendarService = CalendarService_1 = class CalendarService {
    prisma;
    configService;
    logger = new common_1.Logger(CalendarService_1.name);
    maxSyncRetries = 3;
    retryState = new Map();
    constructor(prisma, configService) {
        this.prisma = prisma;
        this.configService = configService;
    }
    async getAuthUrl(calendarId) {
        const oauth2Client = this.createOAuthClient();
        const requestedCalendarId = calendarId || DEFAULT_CALENDAR_ID;
        const statePayload = Buffer.from(JSON.stringify({
            calendarId: requestedCalendarId,
            ts: Date.now(),
        }), 'utf8').toString('base64url');
        const url = oauth2Client.generateAuthUrl({
            access_type: 'offline',
            prompt: 'consent',
            scope: [GOOGLE_CALENDAR_SCOPE],
            state: statePayload,
        });
        return { url, calendarId: requestedCalendarId };
    }
    async handleOAuthCallback(code, state) {
        const oauth2Client = this.createOAuthClient();
        const { tokens } = await oauth2Client.getToken(code);
        if (!tokens.access_token) {
            throw new common_1.InternalServerErrorException('Google did not return an access token.');
        }
        const existing = await this.prisma.googleCalendarConfig.findFirst({
            orderBy: { createdAt: 'asc' },
        });
        const requestedCalendarId = this.parseCalendarIdFromState(state);
        const refreshToken = tokens.refresh_token || existing?.refreshToken;
        if (!refreshToken) {
            throw new common_1.InternalServerErrorException('Google did not return a refresh token. Reconnect with consent prompt.');
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
        let config;
        if (existing) {
            config = await this.prisma.googleCalendarConfig.update({
                where: { id: existing.id },
                data: payload,
            });
        }
        else {
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
    syncBookingCreated(bookingId) {
        const key = `booking-create:${bookingId}`;
        void this.runWithRetry(key, async () => {
            const booking = await this.prisma.booking.findUnique({ where: { id: bookingId } });
            if (!booking) {
                throw new common_1.NotFoundException(`Booking ${bookingId} not found for sync.`);
            }
            if (booking.googleEventId) {
                return;
            }
            const calendar = await this.getCalendarClientIfConnected();
            if (!calendar) {
                this.logger.warn('Google Calendar is not connected. Skipping event creation.');
                return;
            }
            const inserted = await calendar.events.insert({
                calendarId: calendar.calendarId,
                requestBody: this.buildBookingEventRequest(booking),
            });
            const eventId = inserted.data.id;
            if (!eventId) {
                throw new common_1.InternalServerErrorException('Google did not return event id.');
            }
            await this.prisma.booking.update({
                where: { id: booking.id },
                data: { googleEventId: eventId },
            });
        });
    }
    syncBookingRescheduled(bookingId) {
        const key = `booking-reschedule:${bookingId}`;
        void this.runWithRetry(key, async () => {
            const booking = await this.prisma.booking.findUnique({ where: { id: bookingId } });
            if (!booking) {
                throw new common_1.NotFoundException(`Booking ${bookingId} not found for sync.`);
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
            await calendar.events.update({
                calendarId: calendar.calendarId,
                eventId: booking.googleEventId,
                requestBody: this.buildBookingEventRequest(booking),
            });
        });
    }
    syncBookingCancelled(bookingId) {
        const key = `booking-cancel:${bookingId}`;
        void this.runWithRetry(key, async () => {
            const booking = await this.prisma.booking.findUnique({ where: { id: bookingId } });
            if (!booking) {
                throw new common_1.NotFoundException(`Booking ${bookingId} not found for sync.`);
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
                await calendar.events.delete({
                    calendarId: calendar.calendarId,
                    eventId: booking.googleEventId,
                });
            }
            catch (error) {
                if (this.isGoogleNotFoundError(error)) {
                    this.logger.warn(`Google event ${booking.googleEventId} already deleted. Clearing local reference.`);
                }
                else {
                    throw error;
                }
            }
            await this.prisma.booking.update({
                where: { id: booking.id },
                data: { googleEventId: null },
            });
        });
    }
    syncBlockedDateCreated(blockedDateId) {
        const key = `blocked-date-create:${blockedDateId}`;
        void this.runWithRetry(key, async () => {
            const blockedDate = await this.prisma.blockedDate.findUnique({
                where: { id: blockedDateId },
            });
            if (!blockedDate) {
                throw new common_1.NotFoundException(`Blocked date ${blockedDateId} not found for sync.`);
            }
            if (blockedDate.googleEventId) {
                return;
            }
            const calendar = await this.getCalendarClientIfConnected();
            if (!calendar) {
                this.logger.warn('Google Calendar is not connected. Skipping blocked date event creation.');
                return;
            }
            const inserted = await calendar.events.insert({
                calendarId: calendar.calendarId,
                requestBody: this.buildBlockedDateRequest(blockedDate),
            });
            const eventId = inserted.data.id;
            if (!eventId) {
                throw new common_1.InternalServerErrorException('Google did not return event id.');
            }
            await this.prisma.blockedDate.update({
                where: { id: blockedDate.id },
                data: { googleEventId: eventId },
            });
        });
    }
    syncBlockedDateRemoved(googleEventId) {
        if (!googleEventId) {
            return;
        }
        const key = `blocked-date-delete:${googleEventId}`;
        void this.runWithRetry(key, async () => {
            const calendar = await this.getCalendarClientIfConnected();
            if (!calendar) {
                this.logger.warn('Google Calendar is not connected. Skipping blocked date event deletion.');
                return;
            }
            try {
                await calendar.events.delete({
                    calendarId: calendar.calendarId,
                    eventId: googleEventId,
                });
            }
            catch (error) {
                if (!this.isGoogleNotFoundError(error)) {
                    throw error;
                }
            }
        });
    }
    createOAuthClient() {
        const clientId = this.configService.get('GOOGLE_CLIENT_ID');
        const clientSecret = this.configService.get('GOOGLE_CLIENT_SECRET');
        const redirectUri = this.configService.get('GOOGLE_REDIRECT_URI');
        if (!clientId || !clientSecret || !redirectUri) {
            throw new common_1.InternalServerErrorException('Google OAuth env vars are missing (GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI).');
        }
        return new googleapis_1.google.auth.OAuth2(clientId, clientSecret, redirectUri);
    }
    parseCalendarIdFromState(state) {
        if (!state) {
            return DEFAULT_CALENDAR_ID;
        }
        try {
            const decoded = Buffer.from(state, 'base64url').toString('utf8');
            const parsed = JSON.parse(decoded);
            if (typeof parsed.calendarId === 'string' && parsed.calendarId.trim()) {
                return parsed.calendarId.trim();
            }
            return DEFAULT_CALENDAR_ID;
        }
        catch {
            return DEFAULT_CALENDAR_ID;
        }
    }
    async getCalendarClientIfConnected() {
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
        const client = googleapis_1.google.calendar({ version: 'v3', auth: oauth2Client });
        return {
            client,
            calendarId: refreshed.calendarId,
        };
    }
    async refreshIfNeeded(config, oauth2Client) {
        const bufferMs = 60_000;
        if (config.tokenExpiry.getTime() - Date.now() > bufferMs) {
            return config;
        }
        const { credentials } = await oauth2Client.refreshAccessToken();
        if (!credentials.access_token) {
            throw new common_1.InternalServerErrorException('Unable to refresh Google access token.');
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
    buildBookingEventRequest(booking) {
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
    buildBlockedDateRequest(blockedDate) {
        const dateStr = this.dateToYmd(blockedDate.date);
        const summary = 'BLOCKED - St Agnes';
        const description = [
            blockedDate.reason ? `Reason: ${blockedDate.reason}` : undefined,
            `Blocked date ID: ${blockedDate.id}`,
        ]
            .filter(Boolean)
            .join('\n');
        if (!blockedDate.startTime || !blockedDate.endTime) {
            const nextDate = this.dateToYmd(new Date(blockedDate.date.getTime() + 24 * 60 * 60 * 1000));
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
    dateToYmd(date) {
        return date.toISOString().slice(0, 10);
    }
    lagosHhmToUtc(date, hhMm) {
        const [hours, minutes] = hhMm.split(':').map(Number);
        return new Date(date.getTime() + hours * 3_600_000 + minutes * 60_000 - 60 * 60_000);
    }
    isGoogleNotFoundError(error) {
        if (!error || typeof error !== 'object') {
            return false;
        }
        const maybeResponse = error.response;
        return maybeResponse?.status === 404;
    }
    async runWithRetry(key, operation, attempt = 1) {
        if (attempt === 1 && this.retryState.has(key)) {
            this.logger.debug(`Sync already queued/running for ${key}`);
            return;
        }
        this.retryState.set(key, attempt);
        try {
            await operation();
            this.retryState.delete(key);
        }
        catch (error) {
            if (attempt >= this.maxSyncRetries) {
                this.retryState.delete(key);
                this.logger.error(`Calendar sync failed after ${attempt} attempts for ${key}`, error instanceof Error ? error.stack : String(error));
                return;
            }
            const nextAttempt = attempt + 1;
            const delayMs = Math.min(60_000, 5_000 * 2 ** (attempt - 1));
            this.logger.warn(`Calendar sync failed for ${key}. Retrying in ${delayMs}ms (attempt ${nextAttempt}/${this.maxSyncRetries}).`);
            setTimeout(() => {
                void this.runWithRetry(key, operation, nextAttempt);
            }, delayMs);
        }
    }
};
exports.CalendarService = CalendarService;
exports.CalendarService = CalendarService = CalendarService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        config_1.ConfigService])
], CalendarService);
//# sourceMappingURL=calendar.service.js.map