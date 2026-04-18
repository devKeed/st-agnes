import { BlockedDate, BusinessHours, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CalendarService } from '../calendar/calendar.service.js';
import { BlockDateDto, QueryAvailabilityDto, QueryBlockedDatesDto, UpdateBusinessHoursDto } from './dto';
export interface TimeSlot {
    start: string;
    end: string;
}
export interface DayAvailability {
    date: string;
    slots: TimeSlot[];
}
export interface AvailabilityResponse {
    month: string;
    timezone: string;
    available_slots: DayAvailability[];
    blocked_dates: string[];
}
export interface BlockedDateEntry {
    id: string;
    date: string;
    startTime: string | null;
    endTime: string | null;
    reason: string | null;
    createdAt: string;
    blockedById: string | null;
}
export declare class AvailabilityService {
    private readonly prisma;
    private readonly calendarService;
    constructor(prisma: PrismaService, calendarService: CalendarService);
    getMonthAvailability(query: QueryAvailabilityDto): Promise<AvailabilityResponse>;
    getBusinessHours(): Promise<BusinessHours[]>;
    listBlockedDates(query: QueryBlockedDatesDto): Promise<BlockedDateEntry[]>;
    blockDate(dto: BlockDateDto, adminId: string): Promise<BlockedDate>;
    unblockDate(id: string): Promise<{
        id: string;
    }>;
    updateBusinessHours(dto: UpdateBusinessHoursDto): Promise<BusinessHours[]>;
    isSlotAvailable(startTime: Date, endTime: Date, excludeBookingId?: string, db?: Prisma.TransactionClient | PrismaService): Promise<boolean>;
    toLagosDateStr(date: Date): string;
    private lagosDateDayOfWeek;
    private toLagosDateUtcMidnight;
    lagosHhmToUtc(date: Date, hhMm: string): Date;
    parseDateStr(str: string): Date;
}
