import { BlockedDate, BusinessHours, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { BlockDateDto, QueryAvailabilityDto, UpdateBusinessHoursDto } from './dto';
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
export declare class AvailabilityService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getMonthAvailability(query: QueryAvailabilityDto): Promise<AvailabilityResponse>;
    getBusinessHours(): Promise<BusinessHours[]>;
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
