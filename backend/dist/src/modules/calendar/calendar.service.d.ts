import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
export declare class CalendarService {
    private readonly prisma;
    private readonly configService;
    private readonly logger;
    private readonly maxSyncRetries;
    private readonly retryState;
    constructor(prisma: PrismaService, configService: ConfigService);
    getAuthUrl(calendarId?: string): Promise<{
        url: string;
        calendarId: string;
    }>;
    handleOAuthCallback(code: string, state?: string): Promise<{
        calendarId: string;
        connectedAt: Date;
        tokenExpiry: Date;
    }>;
    getStatus(): Promise<{
        connected: boolean;
        calendarId: null;
        tokenExpiry: null;
        hasRefreshToken: boolean;
        updatedAt: null;
    } | {
        connected: boolean;
        calendarId: string;
        tokenExpiry: Date;
        hasRefreshToken: boolean;
        updatedAt: Date;
    }>;
    disconnect(): Promise<{
        disconnected: boolean;
        removedConfigs: number;
    }>;
    syncBookingCreated(bookingId: string): void;
    syncBookingRescheduled(bookingId: string): void;
    syncBookingCancelled(bookingId: string): void;
    syncBlockedDateCreated(blockedDateId: string): void;
    syncBlockedDateRemoved(googleEventId: string | null | undefined): void;
    private createOAuthClient;
    private parseCalendarIdFromState;
    private getCalendarClientIfConnected;
    private refreshIfNeeded;
    private buildBookingEventRequest;
    private buildBlockedDateRequest;
    private dateToYmd;
    private lagosHhmToUtc;
    private isGoogleNotFoundError;
    private runWithRetry;
}
