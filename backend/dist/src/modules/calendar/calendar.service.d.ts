import { PrismaService } from '../../prisma/prisma.service';
export declare class CalendarService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    getAuthUrl(adminId: string): {
        url: string;
    };
    handleOAuthCallback(params: {
        code?: string;
        state?: string;
        error?: string;
    }): Promise<{
        success: boolean;
        message: string;
        calendarId?: undefined;
    } | {
        success: boolean;
        message: string;
        calendarId: string;
    }>;
    getStatus(): Promise<{
        connected: boolean;
        calendarId: null;
        tokenExpiry: null;
        hasRefreshToken: boolean;
    } | {
        connected: boolean;
        calendarId: string;
        tokenExpiry: Date;
        hasRefreshToken: boolean;
    }>;
    disconnect(): Promise<{
        success: boolean;
    }>;
    syncBookingCreated(bookingId: string): void;
    syncBookingRescheduled(bookingId: string): void;
    syncBookingCancelled(bookingId: string): void;
    syncBlockedDateCreated(blockedDateId: string): void;
    syncBlockedDateDeleted(googleEventId: string | null | undefined): void;
    private createBookingEvent;
    private updateBookingEvent;
    private deleteBookingEvent;
    private createBlockedDateEvent;
    private deleteEventById;
    private createOAuthClient;
    private getCalendarContext;
    private executeCalendarCall;
    private buildBookingDescription;
    private timezone;
    private signState;
    private verifyState;
    private hhmToUtcIso;
    private nextDateStr;
    private isGoogleAuthError;
    private isGoogleNotFound;
    private errorMessage;
}
