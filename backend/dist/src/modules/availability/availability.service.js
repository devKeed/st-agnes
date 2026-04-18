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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AvailabilityService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../prisma/prisma.service");
const calendar_service_1 = require("../calendar/calendar.service");
const LAGOS_OFFSET_MINUTES = 60;
let AvailabilityService = class AvailabilityService {
    prisma;
    calendarService;
    constructor(prisma, calendarService) {
        this.prisma = prisma;
        this.calendarService = calendarService;
    }
    async getMonthAvailability(query) {
        const [year, month] = query.month.split('-').map(Number);
        const serviceType = query.service ?? client_1.ServiceType.CUSTOM_DESIGN;
        const config = await this.prisma.serviceTypeConfig.findUnique({
            where: { serviceType },
        });
        const durationMinutes = config?.durationMinutes ?? 60;
        const businessHours = await this.prisma.businessHours.findMany();
        const bhMap = new Map(businessHours.map((bh) => [bh.dayOfWeek, bh]));
        const monthStart = new Date(Date.UTC(year, month - 1, 1));
        const monthEnd = new Date(Date.UTC(year, month, 1));
        const [blockedDates, confirmedBookings] = await Promise.all([
            this.prisma.blockedDate.findMany({
                where: {
                    date: { gte: monthStart, lt: monthEnd },
                },
            }),
            this.prisma.booking.findMany({
                where: {
                    status: client_1.BookingStatus.CONFIRMED,
                    startTime: { gte: monthStart, lt: monthEnd },
                },
                select: { startTime: true, endTime: true },
            }),
        ]);
        const fullDayBlocked = new Set();
        const timeRangeBlocks = [];
        for (const bd of blockedDates) {
            const lagosDateStr = this.toLagosDateStr(bd.date);
            if (!bd.startTime || !bd.endTime) {
                fullDayBlocked.add(lagosDateStr);
            }
            else {
                timeRangeBlocks.push({
                    date: lagosDateStr,
                    startUtc: this.lagosHhmToUtc(bd.date, bd.startTime),
                    endUtc: this.lagosHhmToUtc(bd.date, bd.endTime),
                });
            }
        }
        const available_slots = [];
        const daysInMonth = new Date(year, month, 0).getDate();
        for (let day = 1; day <= daysInMonth; day++) {
            const lagosDate = new Date(Date.UTC(year, month - 1, day));
            const lagosDateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const dayOfWeek = lagosDate.getUTCDay();
            const bh = bhMap.get(dayOfWeek);
            if (!bh || bh.isClosed)
                continue;
            if (fullDayBlocked.has(lagosDateStr))
                continue;
            const openUtc = this.lagosHhmToUtc(lagosDate, bh.openTime);
            const closeUtc = this.lagosHhmToUtc(lagosDate, bh.closeTime);
            const slotMs = durationMinutes * 60_000;
            const dayTimeBlocks = timeRangeBlocks.filter((b) => b.date === lagosDateStr);
            const slots = [];
            let cursor = openUtc.getTime();
            while (cursor + slotMs <= closeUtc.getTime()) {
                const slotStart = cursor;
                const slotEnd = cursor + slotMs;
                const blockedByRange = dayTimeBlocks.some((b) => slotStart < b.endUtc.getTime() && slotEnd > b.startUtc.getTime());
                const blockedByBooking = confirmedBookings.some((b) => slotStart < b.endTime.getTime() &&
                    slotEnd > b.startTime.getTime());
                if (!blockedByRange && !blockedByBooking) {
                    slots.push({
                        start: new Date(slotStart).toISOString(),
                        end: new Date(slotEnd).toISOString(),
                    });
                }
                cursor += slotMs;
            }
            if (slots.length > 0) {
                available_slots.push({ date: lagosDateStr, slots });
            }
        }
        return {
            month: query.month,
            timezone: 'Africa/Lagos',
            available_slots,
            blocked_dates: Array.from(fullDayBlocked),
        };
    }
    getBusinessHours() {
        return this.prisma.businessHours.findMany({ orderBy: { dayOfWeek: 'asc' } });
    }
    async blockDate(dto, adminId) {
        if ((dto.startTime && !dto.endTime) || (!dto.startTime && dto.endTime)) {
            throw new common_1.BadRequestException('Both startTime and endTime must be provided together for a time-range block.');
        }
        const dateParsed = this.parseDateStr(dto.date);
        const blockedDate = await this.prisma.blockedDate.create({
            data: {
                date: dateParsed,
                startTime: dto.startTime ?? null,
                endTime: dto.endTime ?? null,
                reason: dto.reason,
                blockedById: adminId,
            },
        });
        this.calendarService.syncBlockedDateCreated(blockedDate.id);
        return blockedDate;
    }
    async unblockDate(id) {
        const existing = await this.prisma.blockedDate.findUnique({ where: { id } });
        if (!existing) {
            throw new common_1.NotFoundException(`Blocked date ${id} not found`);
        }
        await this.prisma.blockedDate.delete({ where: { id } });
        this.calendarService.syncBlockedDateDeleted(existing.googleEventId);
        return { id };
    }
    async updateBusinessHours(dto) {
        const uniqueDays = new Set(dto.hours.map((h) => h.dayOfWeek));
        if (uniqueDays.size !== dto.hours.length) {
            throw new common_1.BadRequestException('Duplicate dayOfWeek values in payload.');
        }
        await this.prisma.$transaction(dto.hours.map((row) => this.prisma.businessHours.upsert({
            where: { dayOfWeek: row.dayOfWeek },
            update: {
                openTime: row.openTime,
                closeTime: row.closeTime,
                isClosed: row.isClosed,
            },
            create: {
                dayOfWeek: row.dayOfWeek,
                openTime: row.openTime,
                closeTime: row.closeTime,
                isClosed: row.isClosed,
            },
        })));
        return this.getBusinessHours();
    }
    async isSlotAvailable(startTime, endTime, excludeBookingId, db = this.prisma) {
        const dayOfWeek = this.lagosDateDayOfWeek(startTime);
        const bh = await db.businessHours.findUnique({ where: { dayOfWeek } });
        if (!bh || bh.isClosed)
            return false;
        const slotDate = this.toLagosDateUtcMidnight(startTime);
        const openUtc = this.lagosHhmToUtc(slotDate, bh.openTime);
        const closeUtc = this.lagosHhmToUtc(slotDate, bh.closeTime);
        if (startTime < openUtc || endTime > closeUtc)
            return false;
        const blocked = await db.blockedDate.findFirst({
            where: {
                date: slotDate,
                OR: [
                    { startTime: null },
                    { startTime: { not: null }, endTime: { not: null } },
                ],
            },
        });
        if (blocked) {
            if (!blocked.startTime || !blocked.endTime)
                return false;
            const bStart = this.lagosHhmToUtc(slotDate, blocked.startTime);
            const bEnd = this.lagosHhmToUtc(slotDate, blocked.endTime);
            if (startTime < bEnd && endTime > bStart)
                return false;
        }
        const overlap = await db.booking.findFirst({
            where: {
                status: client_1.BookingStatus.CONFIRMED,
                ...(excludeBookingId ? { NOT: { id: excludeBookingId } } : {}),
                AND: [{ startTime: { lt: endTime } }, { endTime: { gt: startTime } }],
            },
        });
        return overlap === null;
    }
    toLagosDateStr(date) {
        const lagosMs = date.getTime() + LAGOS_OFFSET_MINUTES * 60_000;
        const d = new Date(lagosMs);
        return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
    }
    lagosDateDayOfWeek(utcDate) {
        const lagosMs = utcDate.getTime() + LAGOS_OFFSET_MINUTES * 60_000;
        return new Date(lagosMs).getUTCDay();
    }
    toLagosDateUtcMidnight(utcDate) {
        const lagosMs = utcDate.getTime() + LAGOS_OFFSET_MINUTES * 60_000;
        const d = new Date(lagosMs);
        return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
    }
    lagosHhmToUtc(date, hhMm) {
        const [h, m] = hhMm.split(':').map(Number);
        return new Date(date.getTime() + h * 3_600_000 + m * 60_000 - LAGOS_OFFSET_MINUTES * 60_000);
    }
    parseDateStr(str) {
        const [y, mo, d] = str.split('-').map(Number);
        return new Date(Date.UTC(y, mo - 1, d));
    }
};
exports.AvailabilityService = AvailabilityService;
exports.AvailabilityService = AvailabilityService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        calendar_service_1.CalendarService])
], AvailabilityService);
//# sourceMappingURL=availability.service.js.map