import { CalendarService } from './calendar.service';
export declare class CalendarController {
    private readonly calendarService;
    constructor(calendarService: CalendarService);
    getAuthUrl(calendarId?: string): Promise<{
        url: string;
        calendarId: string;
    }>;
    callback(code?: string, state?: string, error?: string): Promise<{
        calendarId: string;
        connectedAt: Date;
        tokenExpiry: Date;
        success: boolean;
        message: string;
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
}
