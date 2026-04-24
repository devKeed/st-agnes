import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Booking, BookingStatus, Prisma, RentalStatus, ServiceType } from '@prisma/client';
import { nanoid } from 'nanoid';
import { PrismaService } from '../../prisma/prisma.service';
import { AvailabilityService } from '../availability/availability.service';
import { CalendarService } from '../calendar/calendar.service.js';
import { EmailService } from '../email/email.service';
import {
  CreateBookingDto,
  QueryBookingsDto,
  RecoverBookingDto,
  RescheduleBookingDto,
  UpdateBookingStatusDto,
} from './dto';
import type { PaginatedResponse } from '../../common/dto';

const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

const bookingWithItems = Prisma.validator<Prisma.BookingInclude>()({
  bookingItems: {
    include: { rentalProduct: true },
  },
});

type BookingWithItems = Prisma.BookingGetPayload<{
  include: typeof bookingWithItems;
}>;

@Injectable()
export class BookingsService {
  private readonly logger = new Logger(BookingsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly availabilityService: AvailabilityService,
    private readonly calendarService: CalendarService,
    private readonly emailService: EmailService,
  ) {}

  // ─── Public: create booking ──────────────────────────────────────────────────

  async create(dto: CreateBookingDto): Promise<{
    booking: BookingWithItems;
    manageUrl: string;
  }> {
    if (!dto.termsAccepted) {
      throw new BadRequestException('Terms must be accepted to make a booking.');
    }

    const startTime = new Date(dto.startTime);

    const config = await this.prisma.serviceTypeConfig.findUnique({
      where: { serviceType: dto.serviceType },
    });
    if (!config || !config.isActive) {
      throw new BadRequestException(
        `Service type ${dto.serviceType} is not available.`,
      );
    }

    const endTime = new Date(
      startTime.getTime() + config.durationMinutes * 60_000,
    );

    const termsVersion = await this.prisma.termsVersion.findUnique({
      where: { id: dto.termsVersionId },
    });
    if (!termsVersion || !termsVersion.isActive) {
      throw new BadRequestException(
        'The provided terms version is not active. Refresh the page and try again.',
      );
    }

    if (dto.serviceType === ServiceType.RENTAL) {
      if (!dto.rentalItems || dto.rentalItems.length === 0) {
        throw new BadRequestException(
          'At least one rental item is required for a RENTAL booking.',
        );
      }
    }

    const manageToken = nanoid(32);
    const frontendUrl =
      process.env.FRONTEND_URL ?? 'http://localhost:3000';

    const booking = await this.prisma.$transaction(async (tx) => {
      // 1. Check slot availability inside the transaction so the read and write
      //    are atomic — prevents double-bookings under concurrent requests.
      const isAvailable = await this.availabilityService.isSlotAvailable(
        startTime,
        endTime,
        undefined,
        tx,
      );
      if (!isAvailable) {
        throw new ConflictException(
          'The requested time slot is not available. Please choose a different time.',
        );
      }

      // 2. Validate rental items (if applicable)
      if (dto.serviceType === ServiceType.RENTAL && dto.rentalItems) {
        for (const item of dto.rentalItems) {
          const product = await tx.rentalProduct.findUnique({
            where: { id: item.rentalProductId },
          });
          if (!product || !product.isVisible) {
            throw new ConflictException(
              `Rental item ${item.rentalProductId} is not available.`,
            );
          }
          if (
            product.status === RentalStatus.MAINTENANCE ||
            product.status === RentalStatus.RETIRED
          ) {
            throw new ConflictException(
              `Rental item ${item.rentalProductId} is not currently available.`,
            );
          }
          if (item.selectedSize && !product.sizes.includes(item.selectedSize)) {
            throw new BadRequestException(
              `Size '${item.selectedSize}' is not available for rental item ${item.rentalProductId}.`,
            );
          }
          // Count how many confirmed bookings already hold this item in the requested window.
          // Block only when all units are taken (booked >= quantity).
          const overlappingCount = await tx.bookingItem.count({
            where: {
              rentalProductId: item.rentalProductId,
              booking: {
                status: BookingStatus.CONFIRMED,
                AND: [
                  { startTime: { lt: endTime } },
                  { endTime: { gt: startTime } },
                ],
              },
            },
          });
          if (overlappingCount >= product.quantity) {
            throw new ConflictException(
              `Rental item ${item.rentalProductId} is fully booked for the requested time.`,
            );
          }
        }
      }

      // 3. Create booking
      const newBooking = await tx.booking.create({
        data: {
          clientName: dto.clientName,
          clientEmail: dto.clientEmail,
          clientPhone: dto.clientPhone,
          serviceType: dto.serviceType,
          durationMinutes: config.durationMinutes,
          startTime,
          endTime,
          notes: dto.notes,
          specialRequests: dto.specialRequests,
          status: BookingStatus.CONFIRMED,
          manageToken,
          termsVersionId: dto.termsVersionId,
          termsAccepted: true,
          termsAcceptedAt: new Date(),
          bookingItems:
            dto.rentalItems && dto.rentalItems.length > 0
              ? {
                  create: dto.rentalItems.map((item) => ({
                    rentalProductId: item.rentalProductId,
                    selectedSize: item.selectedSize,
                  })),
                }
              : undefined,
        },
        include: bookingWithItems,
      });

      return newBooking;
    });

    this.logger.log(
      `Booking created: ${booking.id} (${booking.serviceType}) for ${booking.clientEmail}`,
    );

    this.calendarService.syncBookingCreated(booking.id);
    this.emailService.sendConfirmation(booking.id);

    const manageUrl = `${frontendUrl}/booking-manage/${manageToken}`;
    return { booking, manageUrl };
  }

  // ─── Public: recover bookings by email ──────────────────────────────────────

  async recoverBookings(dto: RecoverBookingDto): Promise<void> {
    // Always return silently — never leak whether bookings exist for an email.
    const bookings = await this.prisma.booking.findMany({
      where: {
        clientEmail: { equals: dto.email, mode: 'insensitive' },
        status: { notIn: [BookingStatus.CANCELLED, BookingStatus.COMPLETED] },
      },
      select: {
        id: true,
        clientName: true,
        manageToken: true,
        serviceType: true,
        startTime: true,
      },
      orderBy: { startTime: 'asc' },
    });

    if (bookings.length === 0) return;

    void this.emailService.sendRecovery(dto.email, bookings);
  }

  // ─── Public: manage via token ────────────────────────────────────────────────

  async findByToken(token: string): Promise<BookingWithItems> {
    const booking = await this.prisma.booking.findUnique({
      where: { manageToken: token },
      include: bookingWithItems,
    });
    if (!booking) {
      throw new NotFoundException('Booking not found');
    }
    return booking;
  }

  async cancelByToken(
    token: string,
    reason?: string,
  ): Promise<BookingWithItems> {
    const booking = await this.findByToken(token);
    this.assertEditWindow(booking);
    if (
      booking.status === BookingStatus.CANCELLED ||
      booking.status === BookingStatus.COMPLETED
    ) {
      throw new BadRequestException(
        `Booking is already ${booking.status.toLowerCase()}.`,
      );
    }

    const updated = await this.prisma.booking.update({
      where: { id: booking.id },
      data: {
        status: BookingStatus.CANCELLED,
        cancellationReason: reason,
      },
      include: bookingWithItems,
    });

    this.calendarService.syncBookingCancelled(updated.id);
    this.emailService.sendCancellation(updated.id);

    return updated;
  }

  async rescheduleByToken(
    token: string,
    dto: RescheduleBookingDto,
  ): Promise<BookingWithItems> {
    const booking = await this.findByToken(token);
    this.assertEditWindow(booking);
    if (booking.status !== BookingStatus.CONFIRMED) {
      throw new BadRequestException(
        'Only confirmed bookings can be rescheduled.',
      );
    }

    const newStart = new Date(dto.startTime);
    const newEnd = new Date(newStart.getTime() + booking.durationMinutes * 60_000);

    const updated = await this.prisma.$transaction(async (tx) => {
      const isAvailable = await this.availabilityService.isSlotAvailable(
        newStart,
        newEnd,
        booking.id,
        tx,
      );
      if (!isAvailable) {
        throw new ConflictException(
          'The new time slot is not available. Please choose a different time.',
        );
      }

      return tx.booking.update({
        where: { id: booking.id },
        data: { startTime: newStart, endTime: newEnd },
        include: bookingWithItems,
      });
    });

    this.calendarService.syncBookingRescheduled(updated.id);
    this.emailService.sendReschedule(updated.id);

    return updated;
  }

  // ─── Admin: list / detail / status ──────────────────────────────────────────

  async findAll(
    query: QueryBookingsDto,
  ): Promise<PaginatedResponse<BookingWithItems>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const where: Prisma.BookingWhereInput = {
      ...(query.status ? { status: query.status } : {}),
      ...(query.serviceType ? { serviceType: query.serviceType } : {}),
      ...(query.dateFrom || query.dateTo
        ? {
            startTime: {
              ...(query.dateFrom ? { gte: new Date(query.dateFrom) } : {}),
              ...(query.dateTo ? { lte: new Date(query.dateTo) } : {}),
            },
          }
        : {}),
      ...(query.search
        ? {
            OR: [
              { clientName: { contains: query.search, mode: 'insensitive' } },
              { clientEmail: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.booking.findMany({
        where,
        include: bookingWithItems,
        orderBy: { startTime: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.booking.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) },
    };
  }

  async findOne(id: string): Promise<BookingWithItems> {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: bookingWithItems,
    });
    if (!booking) throw new NotFoundException(`Booking ${id} not found`);
    return booking;
  }

  async updateStatus(
    id: string,
    dto: UpdateBookingStatusDto,
  ): Promise<BookingWithItems> {
    const existing = await this.findOne(id);
    const updated = await this.prisma.booking.update({
      where: { id },
      data: {
        status: dto.status,
        ...(dto.cancellationReason
          ? { cancellationReason: dto.cancellationReason }
          : {}),
      },
      include: bookingWithItems,
    });

    if (
      dto.status === BookingStatus.CANCELLED &&
      existing.status !== BookingStatus.CANCELLED
    ) {
      this.calendarService.syncBookingCancelled(updated.id);
      this.emailService.sendCancellation(updated.id);
    }

    return updated;
  }

  // ─── Private helpers ─────────────────────────────────────────────────────────

  private assertEditWindow(booking: Booking): void {
    const hoursUntilStart = booking.startTime.getTime() - Date.now();
    if (hoursUntilStart < TWENTY_FOUR_HOURS_MS) {
      throw new ForbiddenException(
        'Bookings cannot be changed within 24 hours of the appointment.',
      );
    }
  }
}
