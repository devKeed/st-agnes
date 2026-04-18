import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BlockedDate, BookingStatus, BusinessHours, Prisma, ServiceType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CalendarService } from '../calendar/calendar.service.js';
import {
  BlockDateDto,
  QueryAvailabilityDto,
  QueryBlockedDatesDto,
  UpdateBusinessHoursDto,
} from './dto';

// Nigeria is UTC+1 year-round (no DST observed).
const LAGOS_OFFSET_MINUTES = 60;

export interface TimeSlot {
  start: string; // ISO UTC
  end: string;   // ISO UTC
}

export interface DayAvailability {
  date: string;   // YYYY-MM-DD (Lagos calendar date)
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

@Injectable()
export class AvailabilityService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly calendarService: CalendarService,
  ) {}

  // ─── Public: slot availability ──────────────────────────────────────────────

  async getMonthAvailability(
    query: QueryAvailabilityDto,
  ): Promise<AvailabilityResponse> {
    const [year, month] = query.month.split('-').map(Number);
    const serviceType = query.service ?? ServiceType.CUSTOM_DESIGN;

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
          status: BookingStatus.CONFIRMED,
          startTime: { gte: monthStart, lt: monthEnd },
        },
        select: { startTime: true, endTime: true },
      }),
    ]);

    const fullDayBlocked = new Set<string>();
    const timeRangeBlocks: Array<{
      date: string;
      startUtc: Date;
      endUtc: Date;
    }> = [];

    for (const bd of blockedDates) {
      const lagosDateStr = this.toLagosDateStr(bd.date);
      if (!bd.startTime || !bd.endTime) {
        fullDayBlocked.add(lagosDateStr);
      } else {
        timeRangeBlocks.push({
          date: lagosDateStr,
          startUtc: this.lagosHhmToUtc(bd.date, bd.startTime),
          endUtc: this.lagosHhmToUtc(bd.date, bd.endTime),
        });
      }
    }

    const available_slots: DayAvailability[] = [];
    const daysInMonth = new Date(year, month, 0).getDate();

    for (let day = 1; day <= daysInMonth; day++) {
      const lagosDate = new Date(Date.UTC(year, month - 1, day));
      const lagosDateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayOfWeek = lagosDate.getUTCDay();

      const bh = bhMap.get(dayOfWeek);
      if (!bh || bh.isClosed) continue;
      if (fullDayBlocked.has(lagosDateStr)) continue;

      const openUtc = this.lagosHhmToUtc(lagosDate, bh.openTime);
      const closeUtc = this.lagosHhmToUtc(lagosDate, bh.closeTime);
      const slotMs = durationMinutes * 60_000;

      const dayTimeBlocks = timeRangeBlocks.filter(
        (b) => b.date === lagosDateStr,
      );

      const slots: TimeSlot[] = [];
      let cursor = openUtc.getTime();

      while (cursor + slotMs <= closeUtc.getTime()) {
        const slotStart = cursor;
        const slotEnd = cursor + slotMs;

        const blockedByRange = dayTimeBlocks.some(
          (b) =>
            slotStart < b.endUtc.getTime() && slotEnd > b.startUtc.getTime(),
        );

        const blockedByBooking = confirmedBookings.some(
          (b) =>
            slotStart < b.endTime.getTime() &&
            slotEnd > b.startTime.getTime(),
        );

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

  // ─── Public: business hours ──────────────────────────────────────────────────

  getBusinessHours(): Promise<BusinessHours[]> {
    return this.prisma.businessHours.findMany({ orderBy: { dayOfWeek: 'asc' } });
  }

  // ─── Admin: blocked dates ────────────────────────────────────────────────────

  async listBlockedDates(query: QueryBlockedDatesDto): Promise<BlockedDateEntry[]> {
    let where: Prisma.BlockedDateWhereInput = {};

    if (query.month) {
      const [year, month] = query.month.split('-').map(Number);
      const monthStart = new Date(Date.UTC(year, month - 1, 1));
      const monthEnd = new Date(Date.UTC(year, month, 1));
      where = {
        date: {
          gte: monthStart,
          lt: monthEnd,
        },
      };
    }

    const data = await this.prisma.blockedDate.findMany({
      where,
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }, { createdAt: 'desc' }],
    });

    const monthPrefix = query.month ? `${query.month}-` : null;

    return data
      .filter((item) => (monthPrefix ? this.toLagosDateStr(item.date).startsWith(monthPrefix) : true))
      .map((item) => ({
        id: item.id,
        date: this.toLagosDateStr(item.date),
        startTime: item.startTime,
        endTime: item.endTime,
        reason: item.reason,
        createdAt: item.createdAt.toISOString(),
        blockedById: item.blockedById,
      }));
  }

  async blockDate(dto: BlockDateDto, adminId: string): Promise<BlockedDate> {
    if ((dto.startTime && !dto.endTime) || (!dto.startTime && dto.endTime)) {
      throw new BadRequestException(
        'Both startTime and endTime must be provided together for a time-range block.',
      );
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

  async unblockDate(id: string): Promise<{ id: string }> {
    const existing = await this.prisma.blockedDate.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Blocked date ${id} not found`);
    }
    await this.prisma.blockedDate.delete({ where: { id } });

    this.calendarService.syncBlockedDateDeleted(existing.googleEventId);

    return { id };
  }

  // ─── Admin: business hours ───────────────────────────────────────────────────

  async updateBusinessHours(dto: UpdateBusinessHoursDto): Promise<BusinessHours[]> {
    const uniqueDays = new Set(dto.hours.map((h) => h.dayOfWeek));
    if (uniqueDays.size !== dto.hours.length) {
      throw new BadRequestException('Duplicate dayOfWeek values in payload.');
    }

    await this.prisma.$transaction(
      dto.hours.map((row) =>
        this.prisma.businessHours.upsert({
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
        }),
      ),
    );

    return this.getBusinessHours();
  }

  // ─── Internal helpers (also exported for BookingsService) ───────────────────

  /**
   * Checks if a proposed [start, end) window is bookable.
   * Pass `db` (the transaction client) when calling from inside a $transaction
   * so the read is part of the same atomic unit as the booking insert.
   */
  async isSlotAvailable(
    startTime: Date,
    endTime: Date,
    excludeBookingId?: string,
    db: Prisma.TransactionClient | PrismaService = this.prisma,
  ): Promise<boolean> {
    const dayOfWeek = this.lagosDateDayOfWeek(startTime);
    const bh = await db.businessHours.findUnique({ where: { dayOfWeek } });
    if (!bh || bh.isClosed) return false;

    const slotDate = this.toLagosDateUtcMidnight(startTime);
    const openUtc = this.lagosHhmToUtc(slotDate, bh.openTime);
    const closeUtc = this.lagosHhmToUtc(slotDate, bh.closeTime);

    if (startTime < openUtc || endTime > closeUtc) return false;

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
      if (!blocked.startTime || !blocked.endTime) return false;
      const bStart = this.lagosHhmToUtc(slotDate, blocked.startTime);
      const bEnd = this.lagosHhmToUtc(slotDate, blocked.endTime);
      if (startTime < bEnd && endTime > bStart) return false;
    }

    const overlap = await db.booking.findFirst({
      where: {
        status: BookingStatus.CONFIRMED,
        ...(excludeBookingId ? { NOT: { id: excludeBookingId } } : {}),
        AND: [{ startTime: { lt: endTime } }, { endTime: { gt: startTime } }],
      },
    });

    return overlap === null;
  }

  // ─── Timezone helpers ────────────────────────────────────────────────────────

  /** Convert a Date (UTC) to the Lagos calendar date as "YYYY-MM-DD". */
  toLagosDateStr(date: Date): string {
    const lagosMs = date.getTime() + LAGOS_OFFSET_MINUTES * 60_000;
    const d = new Date(lagosMs);
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
  }

  /** Get day-of-week (0=Sun) from a UTC Date interpreted in Lagos time. */
  private lagosDateDayOfWeek(utcDate: Date): number {
    const lagosMs = utcDate.getTime() + LAGOS_OFFSET_MINUTES * 60_000;
    return new Date(lagosMs).getUTCDay();
  }

  /** UTC midnight of the Lagos calendar date that contains the given UTC instant. */
  private toLagosDateUtcMidnight(utcDate: Date): Date {
    const lagosMs = utcDate.getTime() + LAGOS_OFFSET_MINUTES * 60_000;
    const d = new Date(lagosMs);
    return new Date(
      Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()),
    );
  }

  /** Convert an HH:mm Lagos time string on a given UTC-midnight date to a UTC Date. */
  lagosHhmToUtc(date: Date, hhMm: string): Date {
    const [h, m] = hhMm.split(':').map(Number);
    // date is the UTC midnight of the Lagos calendar date
    // Lagos HH:mm = UTC (HH - 1):mm on the same UTC date (since Lagos = UTC+1)
    return new Date(
      date.getTime() + h * 3_600_000 + m * 60_000 - LAGOS_OFFSET_MINUTES * 60_000,
    );
  }

  /** Parse a "YYYY-MM-DD" string to a UTC Date (midnight). */
  parseDateStr(str: string): Date {
    const [y, mo, d] = str.split('-').map(Number);
    return new Date(Date.UTC(y, mo - 1, d));
  }
}
