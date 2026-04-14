import { Injectable } from '@nestjs/common';
import { BookingStatus, Prisma, ReservationStatus } from '@prisma/client';
import { PrismaService } from '../../../common/prisma/prisma.service';

@Injectable()
export class BookingRepository {
  constructor(private readonly prisma: PrismaService) {}

  async hasBookingConflict(startAtUtc: Date, endAtUtc: Date, excludeBookingId?: string) {
    const conflict = await this.prisma.booking.findFirst({
      where: {
        id: excludeBookingId ? { not: excludeBookingId } : undefined,
        status: { not: BookingStatus.CANCELLED },
        startAtUtc: { lt: endAtUtc },
        endAtUtc: { gt: startAtUtc },
      },
      select: { id: true },
    });

    return Boolean(conflict);
  }

  async findConflictingRentalItems(
    rentalItemIds: string[],
    startAtUtc: Date,
    endAtUtc: Date,
    excludeBookingId?: string,
  ) {
    const conflicts = await this.prisma.rentalItemReservation.findMany({
      where: {
        rentalItemId: { in: rentalItemIds },
        status: { not: ReservationStatus.RELEASED },
        bookingId: excludeBookingId ? { not: excludeBookingId } : undefined,
        startAtUtc: { lt: endAtUtc },
        endAtUtc: { gt: startAtUtc },
      },
      select: { rentalItemId: true },
    });

    return [...new Set(conflicts.map((item) => item.rentalItemId))];
  }

  async createConfirmedBooking(
    tx: Prisma.TransactionClient,
    args: {
      referenceCode: string;
      serviceType: Prisma.BookingUncheckedCreateInput['serviceType'];
      clientName: string;
      clientEmail: string;
      clientPhone: string;
      startAtUtc: Date;
      endAtUtc: Date;
      timezone: string;
      notes?: string;
      specialRequests?: string;
      termsVersionId: string;
      privacyVersionId: string;
      managementTokenHash: string;
      rentalItemIds: string[];
    },
  ) {
    const booking = await tx.booking.create({
      data: {
        referenceCode: args.referenceCode,
        serviceType: args.serviceType,
        status: BookingStatus.CONFIRMED,
        clientName: args.clientName,
        clientEmail: args.clientEmail,
        clientPhone: args.clientPhone,
        startAtUtc: args.startAtUtc,
        endAtUtc: args.endAtUtc,
        timezone: args.timezone,
        notes: args.notes,
        specialRequests: args.specialRequests,
        termsVersionId: args.termsVersionId,
        privacyVersionId: args.privacyVersionId,
        managementTokenHash: args.managementTokenHash,
        bookingItems: {
          createMany: {
            data: args.rentalItemIds.map((rentalItemId) => ({
              rentalItemId,
            })),
          },
        },
      },
    });

    await tx.rentalItemReservation.createMany({
      data: args.rentalItemIds.map((rentalItemId) => ({
        bookingId: booking.id,
        rentalItemId,
        startAtUtc: args.startAtUtc,
        endAtUtc: args.endAtUtc,
      })),
    });

    return booking;
  }
}
