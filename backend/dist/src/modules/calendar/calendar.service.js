"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var CalendarService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CalendarService = void 0;
const common_1 = require("@nestjs/common");
const googleapis_1 = require("googleapis");
const crypto = __importStar(require("crypto"));
const prisma_service_1 = require("../../prisma/prisma.service");
const GOOGLE_SCOPES = ['https://www.googleapis.com/auth/calendar'];
const TOKEN_REFRESH_BUFFER_MS = 60_000;
let CalendarService = CalendarService_1 = class CalendarService {
    prisma;
    logger = new common_1.Logger(CalendarService_1.name);
    constructor(prisma) {
        this.prisma = prisma;
    }
    getAuthUrl(adminId) {
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
    async handleOAuthCallback(params) {
        if (params.error) {
            this.logger.warn(`Google OAuth denied: ${params.error}`);
            return {
                success: false,
                message: `Google authorization failed: ${params.error}`,
            };
        }
        if (!params.code) {
            throw new common_1.BadRequestException('Missing OAuth code.');
        }
        if (!params.state) {
            throw new common_1.BadRequestException('Missing OAuth state.');
        }
        this.verifyState(params.state);
        const oauth = this.createOAuthClient();
        const { tokens } = await oauth.getToken(params.code);
        if (!tokens.access_token) {
            throw new common_1.InternalServerErrorException('Google did not return an access token.');
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
        }
        else {
            if (!tokens.refresh_token) {
                throw new common_1.InternalServerErrorException('Google did not return a refresh token. Reconnect with consent prompt.');
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
    async disconnect() {
        await this.prisma.googleCalendarConfig.deleteMany({});
        this.logger.log('Google Calendar disconnected.');
        return { success: true };
    }
    syncBookingCreated(bookingId) {
        void this.createBookingEvent(bookingId).catch((error) => {
            this.logger.warn(`Calendar booking-create sync failed for ${bookingId}: ${this.errorMessage(error)}`);
        });
    }
    syncBookingRescheduled(bookingId) {
        void this.updateBookingEvent(bookingId).catch((error) => {
            this.logger.warn(`Calendar booking-update sync failed for ${bookingId}: ${this.errorMessage(error)}`);
        });
    }
    syncBookingCancelled(bookingId) {
        void this.deleteBookingEvent(bookingId).catch((error) => {
            this.logger.warn(`Calendar booking-delete sync failed for ${bookingId}: ${this.errorMessage(error)}`);
        });
    }
    syncBlockedDateCreated(blockedDateId) {
        void this.createBlockedDateEvent(blockedDateId).catch((error) => {
            this.logger.warn(`Calendar blocked-date create sync failed for ${blockedDateId}: ${this.errorMessage(error)}`);
        });
    }
    syncBlockedDateDeleted(googleEventId) {
        if (!googleEventId)
            return;
        void this.deleteEventById(googleEventId).catch((error) => {
            this.logger.warn(`Calendar blocked-date delete sync failed for ${googleEventId}: ${this.errorMessage(error)}`);
        });
    }
    async createBookingEvent(bookingId) {
        const booking = await this.prisma.booking.findUnique({ where: { id: bookingId } });
        if (!booking || booking.googleEventId)
            return;
        const ctx = await this.getCalendarContext();
        if (!ctx)
            return;
        const event = await this.executeCalendarCall(async () => ctx.calendar.events.insert({
            calendarId: ctx.config.calendarId,
            requestBody: {
                summary: `St Agnes - ${booking.serviceType} (${booking.clientName})`,
                description: this.buildBookingDescription(booking),
                start: { dateTime: booking.startTime.toISOString(), timeZone: this.timezone() },
                end: { dateTime: booking.endTime.toISOString(), timeZone: this.timezone() },
                attendees: booking.clientEmail
                    ? [{ email: booking.clientEmail, displayName: booking.clientName }]
                    : undefined,
            },
        }));
        const eventId = event.data.id;
        if (!eventId)
            return;
        await this.prisma.booking.update({
            where: { id: booking.id },
            data: { googleEventId: eventId },
        });
    }
    async updateBookingEvent(bookingId) {
        const booking = await this.prisma.booking.findUnique({ where: { id: bookingId } });
        if (!booking)
            return;
        if (!booking.googleEventId) {
            await this.createBookingEvent(bookingId);
            return;
        }
        const ctx = await this.getCalendarContext();
        if (!ctx)
            return;
        try {
            await this.executeCalendarCall(async () => ctx.calendar.events.update({
                calendarId: ctx.config.calendarId,
                eventId: booking.googleEventId,
                requestBody: {
                    summary: `St Agnes - ${booking.serviceType} (${booking.clientName})`,
                    description: this.buildBookingDescription(booking),
                    start: { dateTime: booking.startTime.toISOString(), timeZone: this.timezone() },
                    end: { dateTime: booking.endTime.toISOString(), timeZone: this.timezone() },
                    attendees: booking.clientEmail
                        ? [{ email: booking.clientEmail, displayName: booking.clientName }]
                        : undefined,
                },
            }));
        }
        catch (error) {
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
    async deleteBookingEvent(bookingId) {
        const booking = await this.prisma.booking.findUnique({ where: { id: bookingId } });
        if (!booking?.googleEventId)
            return;
        await this.deleteEventById(booking.googleEventId);
        await this.prisma.booking.update({
            where: { id: booking.id },
            data: { googleEventId: null },
        });
    }
    async createBlockedDateEvent(blockedDateId) {
        const blockedDate = await this.prisma.blockedDate.findUnique({
            where: { id: blockedDateId },
        });
        if (!blockedDate || blockedDate.googleEventId)
            return;
        const ctx = await this.getCalendarContext();
        if (!ctx)
            return;
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
                    dateTime: this.hhmToUtcIso(dateStr, blockedDate.startTime),
                    timeZone: this.timezone(),
                },
                end: {
                    dateTime: this.hhmToUtcIso(dateStr, blockedDate.endTime),
                    timeZone: this.timezone(),
                },
            };
        const event = await this.executeCalendarCall(async () => ctx.calendar.events.insert({
            calendarId: ctx.config.calendarId,
            requestBody,
        }));
        const eventId = event.data.id;
        if (!eventId)
            return;
        await this.prisma.blockedDate.update({
            where: { id: blockedDate.id },
            data: { googleEventId: eventId },
        });
    }
    async deleteEventById(eventId) {
        const ctx = await this.getCalendarContext();
        if (!ctx)
            return;
        try {
            await this.executeCalendarCall(async () => ctx.calendar.events.delete({
                calendarId: ctx.config.calendarId,
                eventId,
            }));
        }
        catch (error) {
            if (!this.isGoogleNotFound(error)) {
                throw error;
            }
        }
    }
    createOAuthClient() {
        const clientId = process.env.GOOGLE_CLIENT_ID;
        const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
        const redirectUri = process.env.GOOGLE_REDIRECT_URI;
        if (!clientId || !clientSecret || !redirectUri) {
            throw new common_1.InternalServerErrorException('Google OAuth environment variables are not fully configured.');
        }
        return new googleapis_1.google.auth.OAuth2(clientId, clientSecret, redirectUri);
    }
    async getCalendarContext() {
        const config = await this.prisma.googleCalendarConfig.findFirst({
            orderBy: { createdAt: 'asc' },
        });
        if (!config) {
            return null;
        }
        const oauth = this.createOAuthClient();
        let accessToken = config.accessToken;
        let tokenExpiry = config.tokenExpiry;
        const needsRefresh = config.tokenExpiry.getTime() <= Date.now() + TOKEN_REFRESH_BUFFER_MS;
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
        const calendar = googleapis_1.google.calendar({ version: 'v3', auth: oauth });
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
    async executeCalendarCall(fn) {
        try {
            return await fn();
        }
        catch (error) {
            if (!this.isGoogleAuthError(error)) {
                throw error;
            }
            const config = await this.prisma.googleCalendarConfig.findFirst({
                orderBy: { createdAt: 'asc' },
            });
            if (!config)
                throw error;
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
    buildBookingDescription(booking) {
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
    timezone() {
        return process.env.TIMEZONE || 'Africa/Lagos';
    }
    signState(adminId) {
        const secret = process.env.GOOGLE_OAUTH_STATE_SECRET ||
            process.env.JWT_SECRET ||
            'calendar-state-secret';
        const payload = `${adminId}:${Date.now()}:${crypto.randomUUID()}`;
        const signature = crypto.createHmac('sha256', secret).update(payload).digest('hex');
        return `${Buffer.from(payload, 'utf8').toString('base64url')}.${Buffer.from(signature, 'utf8').toString('base64url')}`;
    }
    verifyState(state) {
        const secret = process.env.GOOGLE_OAUTH_STATE_SECRET ||
            process.env.JWT_SECRET ||
            'calendar-state-secret';
        const [payloadB64, signatureB64] = state.split('.');
        if (!payloadB64 || !signatureB64) {
            throw new common_1.BadRequestException('Invalid OAuth state.');
        }
        const payload = Buffer.from(payloadB64, 'base64url').toString('utf8');
        const signature = Buffer.from(signatureB64, 'base64url').toString('utf8');
        const expected = crypto.createHmac('sha256', secret).update(payload).digest('hex');
        if (signature !== expected) {
            throw new common_1.BadRequestException('Invalid OAuth state signature.');
        }
        const parts = payload.split(':');
        const ts = Number(parts[1]);
        if (!Number.isFinite(ts)) {
            throw new common_1.BadRequestException('Invalid OAuth state payload.');
        }
        if (Date.now() - ts > 10 * 60_000) {
            throw new common_1.BadRequestException('OAuth state expired. Please try again.');
        }
    }
    hhmToUtcIso(dateStr, hhmm) {
        const [year, month, day] = dateStr.split('-').map(Number);
        const [hour, minute] = hhmm.split(':').map(Number);
        const utc = new Date(Date.UTC(year, month - 1, day, hour - 1, minute, 0));
        return utc.toISOString();
    }
    nextDateStr(dateStr) {
        const [year, month, day] = dateStr.split('-').map(Number);
        const d = new Date(Date.UTC(year, month - 1, day + 1));
        return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
    }
    isGoogleAuthError(error) {
        const status = error?.code
            ?? error?.response?.status;
        return status === 401 || status === 403;
    }
    isGoogleNotFound(error) {
        const status = error?.code
            ?? error?.response?.status;
        return status === 404;
    }
    errorMessage(error) {
        if (error instanceof Error) {
            return error.message;
        }
        return 'Unknown error';
    }
};
exports.CalendarService = CalendarService;
exports.CalendarService = CalendarService = CalendarService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CalendarService);
//# sourceMappingURL=calendar.service.js.map