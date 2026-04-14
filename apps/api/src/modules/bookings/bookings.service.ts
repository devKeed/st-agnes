import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BookingStatus, Prisma, ReservationStatus, ServiceType } from '@prisma/client';
import { addMinutes, isBefore } from 'date-fns';
import { fromZonedTime, toZonedTime } from 'date-fns-tz';
import { randomBytes, createHash } from 'crypto';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { CheckAvailabilityDto } from './dto/check-availability.dto';
import { RescheduleBookingDto, SelfServiceActionDto } from './dto/self-service.dto';
import { PoliciesService } from '../policies/policies.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CalendarService } from '../calendar/calendar.service';

const MAX_ITEMS_PER_BOOKING = 5;

@Injectable()
export class BookingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly policiesService: PoliciesService,
    private readonly notificationsService: NotificationsService,
    private readonly calendarService: CalendarService,
  ) {}

  async createBooking(dto: CreateBookingDto) {
    if (!dto.acceptTerms || !dto.acceptPrivacy) {
      throw new BadRequestException('Terms and Privacy must be accepted');
    }

    const dedupedItemIds = [...new Set(dto.rentalItemIds)];
    if (dedupedItemIds.length > MAX_ITEMS_PER_BOOKING) {
      throw new BadRequestException(`Maximum ${MAX_ITEMS_PER_BOOKING} rental items allowed`);
    }

    const startAtUtc = new Date(dto.startAt);
    const endAtUtc = new Date(dto.endAt);
    if (isBefore(endAtUtc, startAtUtc) || endAtUtc.getTime() === startAtUtc.getTime()) {
      throw new BadRequestException('Invalid booking interval');
    }
    if (startAtUtc.getTime() <= Date.now()) {
      throw new BadRequestException('Booking must be in the future');
    }

    const activePolicies = await this.policiesService.getActiveVersions();
    if (!activePolicies.terms || !activePolicies.privacy) {
      throw new BadRequestException('Active terms/privacy policy versions are required');
    }
    const termsVersionId = activePolicies.terms.id;
    const privacyVersionId = activePolicies.privacy.id;

    const referenceCode = `SA-${Date.now().toString().slice(-8)}`;
    const managementToken = randomBytes(24).toString('hex');
    const managementTokenHash = this.hashToken(managementToken);

    const booking = await this.prisma.$transaction(
      async (tx) => {
        const bookingConflict = await tx.booking.findFirst({
          where: {
            status: { not: BookingStatus.CANCELLED },
            startAtUtc: { lt: endAtUtc },
            endAtUtc: { gt: startAtUtc },
          },
        });

        if (bookingConflict) {
          throw new ConflictException('Selected appointment slot is no longer available');
        }

        const conflicts = await tx.rentalItemReservation.findMany({
          where: {
            rentalItemId: { in: dedupedItemIds },
            status: { not: ReservationStatus.RELEASED },
            startAtUtc: { lt: endAtUtc },
            endAtUtc: { gt: startAtUtc },
          },
          select: { rentalItemId: true },
        });

        if (conflicts.length > 0) {
          throw new ConflictException({
            reason: 'RENTAL_ITEM_UNAVAILABLE',
            conflictingRentalItemIds: [...new Set(conflicts.map((item) => item.rentalItemId))],
          });
        }

        const created = await tx.booking.create({
          data: {
            referenceCode,
            status: BookingStatus.CONFIRMED,
            serviceType: dto.serviceType,
            clientName: dto.clientName,
            clientEmail: dto.clientEmail.toLowerCase(),
            clientPhone: dto.clientPhone,
            startAtUtc,
            endAtUtc,
            timezone: dto.timezone,
            notes: dto.notes,
            specialRequests: dto.specialRequests,
            termsVersionId,
            privacyVersionId,
            managementTokenHash,
            bookingItems: {
              createMany: {
                data: dedupedItemIds.map((rentalItemId) => ({ rentalItemId })),
              },
            },
          },
          include: {
            bookingItems: true,
          },
        });

        await tx.rentalItemReservation.createMany({
          data: dedupedItemIds.map((rentalItemId) => ({
            bookingId: created.id,
            rentalItemId,
            startAtUtc,
            endAtUtc,
          })),
        });

        return created;
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );

    await this.notificationsService.sendBookingConfirmation(booking, managementToken);
    await this.calendarService.upsertBookingEvent(booking);

    return {
      booking,
      managementToken,
    };
  }

  async checkAvailability(dto: CheckAvailabilityDto) {
    const timezone = dto.timezone || process.env.BUSINESS_TIMEZONE || 'Africa/Lagos';
    const startRange = new Date(dto.dateFrom);
    const endRange = new Date(dto.dateTo);

    const rules = await this.prisma.availabilityRule.findMany({ orderBy: { weekday: 'asc' } });
    const activeRules =
      rules.length > 0
        ? rules
        : [1, 2, 3, 4, 5].map((weekday) => ({
            id: `default-${weekday}`,
            weekday,
            startMinutes: 9 * 60,
            endMinutes: 17 * 60,
            slotIntervalMin: 30,
            createdAt: new Date(),
            updatedAt: new Date(),
          }));

    const blackouts = await this.prisma.blackoutPeriod.findMany({
      where: {
        startAtUtc: { lt: endRange },
        endAtUtc: { gt: startRange },
      },
    });

    const bookings = await this.prisma.booking.findMany({
      where: {
        status: { not: BookingStatus.CANCELLED },
        startAtUtc: { lt: endRange },
        endAtUtc: { gt: startRange },
      },
      select: { startAtUtc: true, endAtUtc: true },
    });

    const itemReservations = dto.rentalItemIds?.length
      ? await this.prisma.rentalItemReservation.findMany({
          where: {
            rentalItemId: { in: dto.rentalItemIds },
            status: { not: ReservationStatus.RELEASED },
            startAtUtc: { lt: endRange },
            endAtUtc: { gt: startRange },
          },
          select: { rentalItemId: true, startAtUtc: true, endAtUtc: true },
        })
      : [];

    const slots: Array<{ startAt: string; endAt: string; available: boolean }> = [];
    for (let day = new Date(startRange); day <= endRange; day = addMinutes(day, 24 * 60)) {
      const zoned = toZonedTime(day, timezone);
      const weekday = zoned.getDay();
      const dayRules = activeRules.filter((rule) => rule.weekday === weekday);

      for (const rule of dayRules) {
        const dayStart = new Date(zoned);
        dayStart.setHours(0, 0, 0, 0);

        for (
          let cursorMin = rule.startMinutes;
          cursorMin + 60 <= rule.endMinutes;
          cursorMin += rule.slotIntervalMin
        ) {
          const localStart = new Date(dayStart);
          localStart.setMinutes(cursorMin);
          const localEnd = new Date(localStart);
          localEnd.setMinutes(localEnd.getMinutes() + 60);

          const startAtUtc = fromZonedTime(localStart, timezone);
          const endAtUtc = fromZonedTime(localEnd, timezone);

          const blockedByBlackout = blackouts.some(
            (b) => b.startAtUtc < endAtUtc && b.endAtUtc > startAtUtc,
          );
          const blockedByBooking = bookings.some(
            (b) => b.startAtUtc < endAtUtc && b.endAtUtc > startAtUtc,
          );
          const blockedByItems = dto.rentalItemIds?.length
            ? dto.rentalItemIds.some((id) =>
                itemReservations.some(
                  (r) => r.rentalItemId === id && r.startAtUtc < endAtUtc && r.endAtUtc > startAtUtc,
                ),
              )
            : false;

          slots.push({
            startAt: startAtUtc.toISOString(),
            endAt: endAtUtc.toISOString(),
            available: !(blockedByBlackout || blockedByBooking || blockedByItems),
          });
        }
      }
    }

    return { timezone, slots };
  }

  async getByReference(referenceCode: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { referenceCode },
      include: {
        bookingItems: { include: { rentalItem: true } },
      },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    return booking;
  }

  async listAdminBookings() {
    return this.prisma.booking.findMany({
      orderBy: { startAtUtc: 'asc' },
      include: {
        bookingItems: { include: { rentalItem: true } },
      },
    });
  }

  async updateBookingStatus(id: string, status: BookingStatus) {
    const booking = await this.prisma.booking.findUnique({ where: { id } });
    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    const updated = await this.prisma.booking.update({
      where: { id },
      data: {
        status,
        cancelledAt: status === BookingStatus.CANCELLED ? new Date() : null,
      },
    });

    if (status === BookingStatus.CANCELLED) {
      await this.prisma.rentalItemReservation.updateMany({
        where: { bookingId: id },
        data: { status: ReservationStatus.RELEASED },
      });
    }

    return updated;
  }

  async cancelSelfService(referenceCode: string, dto: SelfServiceActionDto) {
    const booking = await this.validateSelfServiceAction(referenceCode, dto.token);
    this.enforceCutoff(booking.startAtUtc);

    await this.prisma.$transaction([
      this.prisma.booking.update({
        where: { id: booking.id },
        data: {
          status: BookingStatus.CANCELLED,
          cancelledAt: new Date(),
          managementTokenUsed: true,
        },
      }),
      this.prisma.rentalItemReservation.updateMany({
        where: { bookingId: booking.id },
        data: { status: ReservationStatus.RELEASED },
      }),
    ]);

    return { success: true };
  }

  async rescheduleSelfService(referenceCode: string, dto: RescheduleBookingDto) {
    const booking = await this.validateSelfServiceAction(referenceCode, dto.token);
    this.enforceCutoff(booking.startAtUtc);

    const newStartAtUtc = new Date(dto.newStartAt);
    const newEndAtUtc = new Date(dto.newEndAt);

    const rentalItemIds = (
      await this.prisma.bookingItem.findMany({ where: { bookingId: booking.id }, select: { rentalItemId: true } })
    ).map((item) => item.rentalItemId);

    const newToken = randomBytes(24).toString('hex');
    const newHash = this.hashToken(newToken);

    await this.prisma.$transaction(
      async (tx) => {
        const bookingConflict = await tx.booking.findFirst({
          where: {
            id: { not: booking.id },
            status: { not: BookingStatus.CANCELLED },
            startAtUtc: { lt: newEndAtUtc },
            endAtUtc: { gt: newStartAtUtc },
          },
        });
        if (bookingConflict) {
          throw new ConflictException('New slot unavailable');
        }

        const conflicts = await tx.rentalItemReservation.findMany({
          where: {
            bookingId: { not: booking.id },
            rentalItemId: { in: rentalItemIds },
            status: { not: ReservationStatus.RELEASED },
            startAtUtc: { lt: newEndAtUtc },
            endAtUtc: { gt: newStartAtUtc },
          },
          select: { rentalItemId: true },
        });

        if (conflicts.length) {
          throw new ConflictException({
            reason: 'RENTAL_ITEM_UNAVAILABLE',
            conflictingRentalItemIds: [...new Set(conflicts.map((x) => x.rentalItemId))],
          });
        }

        await tx.booking.update({
          where: { id: booking.id },
          data: {
            startAtUtc: newStartAtUtc,
            endAtUtc: newEndAtUtc,
            timezone: dto.timezone ?? booking.timezone,
            managementTokenHash: newHash,
            managementTokenUsed: false,
          },
        });

        await tx.rentalItemReservation.updateMany({
          where: { bookingId: booking.id },
          data: {
            startAtUtc: newStartAtUtc,
            endAtUtc: newEndAtUtc,
          },
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );

    const updated = await this.prisma.booking.findUnique({ where: { id: booking.id } });
    if (updated) {
      await this.calendarService.upsertBookingEvent(updated);
      await this.notificationsService.sendBookingConfirmation(updated, newToken);
    }

    return { success: true };
  }

  async upsertAvailabilityRule(dto: {
    weekday: number;
    startMinutes: number;
    endMinutes: number;
    slotIntervalMin: number;
  }) {
    return this.prisma.availabilityRule.create({
      data: {
        weekday: dto.weekday,
        startMinutes: dto.startMinutes,
        endMinutes: dto.endMinutes,
        slotIntervalMin: dto.slotIntervalMin,
      },
    });
  }

  async createBlackout(dto: { startAtUtc: string; endAtUtc: string; reason?: string }) {
    return this.prisma.blackoutPeriod.create({
      data: {
        startAtUtc: new Date(dto.startAtUtc),
        endAtUtc: new Date(dto.endAtUtc),
        reason: dto.reason,
      },
    });
  }

  private async validateSelfServiceAction(referenceCode: string, token: string) {
    const booking = await this.prisma.booking.findUnique({ where: { referenceCode } });
    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    if (booking.managementTokenUsed) {
      throw new ForbiddenException('Management token already used');
    }

    if (!booking.managementTokenHash) {
      throw new ForbiddenException('Management token unavailable');
    }

    if (Date.now() >= booking.startAtUtc.getTime()) {
      throw new ForbiddenException('Token expired');
    }

    if (this.hashToken(token) !== booking.managementTokenHash) {
      throw new ForbiddenException('Invalid token');
    }

    return booking;
  }

  private enforceCutoff(startAtUtc: Date) {
    const msToStart = startAtUtc.getTime() - Date.now();
    const cutoffMs = 24 * 60 * 60 * 1000;
    if (msToStart <= cutoffMs) {
      throw new ForbiddenException('Self-service changes are not allowed within 24 hours of appointment');
    }
  }

  private hashToken(token: string) {
    return createHash('sha256').update(token).digest('hex');
  }
}
