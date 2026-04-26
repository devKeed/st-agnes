import type { Response } from 'express';
import { CalendarService } from './calendar.service.js';
import { UpdateCalendarIdDto } from './dto/update-calendar-id.dto';
export declare class CalendarController {
    private readonly calendarService;
    constructor(calendarService: CalendarService);
    getAuthUrl(adminId: string): {
        url: string;
    };
    handleCallback(code?: string, state?: string, error?: string, res?: Response): Promise<void>;
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
    updateCalendarId(dto: UpdateCalendarIdDto): Promise<{
        success: boolean;
        calendarId: string;
        message: string;
    }>;
    disconnect(): Promise<{
        success: boolean;
    }>;
}
