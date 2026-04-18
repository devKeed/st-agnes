import { CalendarService } from './calendar.service';
export declare class CalendarController {
    private readonly calendarService;
    constructor(calendarService: CalendarService);
    getAuthUrl(adminId: string): {
        url: string;
    };
    handleCallback(code?: string, state?: string, error?: string): Promise<{
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
}
