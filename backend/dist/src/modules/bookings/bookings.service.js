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
var BookingsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.BookingsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const nanoid_1 = require("nanoid");
const prisma_service_1 = require("../../prisma/prisma.service");
const availability_service_1 = require("../availability/availability.service");
const calendar_service_js_1 = require("../calendar/calendar.service.js");
const email_service_1 = require("../email/email.service");
const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;
const bookingWithItems = client_1.Prisma.validator()({
    bookingItems: {
        include: { rentalProduct: true },
    },
});
let BookingsService = BookingsService_1 = class BookingsService {
    prisma;
    availabilityService;
    calendarService;
    emailService;
    logger = new common_1.Logger(BookingsService_1.name);
    constructor(prisma, availabilityService, calendarService, emailService) {
        this.prisma = prisma;
        this.availabilityService = availabilityService;
        this.calendarService = calendarService;
        this.emailService = emailService;
    }
    async create(dto) {
        if (!dto.termsAccepted) {
            throw new common_1.BadRequestException('Terms must be accepted to make a booking.');
        }
        const startTime = new Date(dto.startTime);
        const isRental = dto.serviceType === client_1.ServiceType.RENTAL;
        let endTime;
        let durationMinutes;
        if (isRental) {
            if (!dto.rentalEndDate) {
                throw new common_1.BadRequestException('rentalEndDate is required for RENTAL bookings.');
            }
            if (!dto.rentalItems || dto.rentalItems.length === 0) {
                throw new common_1.BadRequestException('At least one rental item is required for a RENTAL booking.');
            }
            endTime = new Date(`${dto.rentalEndDate}T23:59:59+01:00`);
            if (endTime <= startTime) {
                throw new common_1.BadRequestException('Return date must be after the pickup date.');
            }
            durationMinutes = Math.round((endTime.getTime() - startTime.getTime()) / 60_000);
        }
        else {
            const config = await this.prisma.serviceTypeConfig.findUnique({
                where: { serviceType: dto.serviceType },
            });
            if (!config || !config.isActive) {
                throw new common_1.BadRequestException(`Service type ${dto.serviceType} is not available.`);
            }
            endTime = new Date(startTime.getTime() + config.durationMinutes * 60_000);
            durationMinutes = config.durationMinutes;
        }
        const termsVersion = await this.prisma.termsVersion.findUnique({
            where: { id: dto.termsVersionId },
        });
        if (!termsVersion || !termsVersion.isActive) {
            throw new common_1.BadRequestException('The provided terms version is not active. Refresh the page and try again.');
        }
        const manageToken = (0, nanoid_1.nanoid)(32);
        const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:3000';
        const booking = await this.prisma.$transaction(async (tx) => {
            if (!isRental) {
                const isAvailable = await this.availabilityService.isSlotAvailable(startTime, endTime, undefined, tx);
                if (!isAvailable) {
                    throw new common_1.ConflictException('The requested time slot is not available. Please choose a different time.');
                }
            }
            if (dto.serviceType === client_1.ServiceType.RENTAL && dto.rentalItems) {
                for (const item of dto.rentalItems) {
                    const product = await tx.rentalProduct.findUnique({
                        where: { id: item.rentalProductId },
                    });
                    if (!product || !product.isVisible) {
                        throw new common_1.ConflictException(`Rental item ${item.rentalProductId} is not available.`);
                    }
                    if (product.status === client_1.RentalStatus.MAINTENANCE ||
                        product.status === client_1.RentalStatus.RETIRED) {
                        throw new common_1.ConflictException(`Rental item ${item.rentalProductId} is not currently available.`);
                    }
                    if (item.selectedSize && !product.sizes.includes(item.selectedSize)) {
                        throw new common_1.BadRequestException(`Size '${item.selectedSize}' is not available for rental item ${item.rentalProductId}.`);
                    }
                    const overlappingCount = await tx.bookingItem.count({
                        where: {
                            rentalProductId: item.rentalProductId,
                            booking: {
                                status: client_1.BookingStatus.CONFIRMED,
                                AND: [
                                    { startTime: { lt: endTime } },
                                    { endTime: { gt: startTime } },
                                ],
                            },
                        },
                    });
                    if (overlappingCount >= product.quantity) {
                        throw new common_1.ConflictException(`Rental item ${item.rentalProductId} is fully booked for the requested time.`);
                    }
                }
            }
            const newBooking = await tx.booking.create({
                data: {
                    clientName: dto.clientName,
                    clientEmail: dto.clientEmail,
                    clientPhone: dto.clientPhone,
                    serviceType: dto.serviceType,
                    durationMinutes,
                    startTime,
                    endTime,
                    notes: dto.notes,
                    specialRequests: dto.specialRequests,
                    status: client_1.BookingStatus.CONFIRMED,
                    manageToken,
                    termsVersionId: dto.termsVersionId,
                    termsAccepted: true,
                    termsAcceptedAt: new Date(),
                    bookingItems: dto.rentalItems && dto.rentalItems.length > 0
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
        this.logger.log(`Booking created: ${booking.id} (${booking.serviceType}) for ${booking.clientEmail}`);
        this.calendarService.syncBookingCreated(booking.id);
        this.emailService.sendConfirmation(booking.id);
        const manageUrl = `${frontendUrl}/booking-manage/${manageToken}`;
        return { booking, manageUrl };
    }
    async recoverBookings(dto) {
        const bookings = await this.prisma.booking.findMany({
            where: {
                clientEmail: { equals: dto.email, mode: 'insensitive' },
                status: { notIn: [client_1.BookingStatus.CANCELLED, client_1.BookingStatus.COMPLETED] },
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
        if (bookings.length === 0)
            return;
        void this.emailService.sendRecovery(dto.email, bookings);
    }
    async findByToken(token) {
        const booking = await this.prisma.booking.findUnique({
            where: { manageToken: token },
            include: bookingWithItems,
        });
        if (!booking) {
            throw new common_1.NotFoundException('Booking not found');
        }
        return booking;
    }
    async cancelByToken(token, reason) {
        const booking = await this.findByToken(token);
        this.assertEditWindow(booking);
        if (booking.status === client_1.BookingStatus.CANCELLED ||
            booking.status === client_1.BookingStatus.COMPLETED) {
            throw new common_1.BadRequestException(`Booking is already ${booking.status.toLowerCase()}.`);
        }
        const updated = await this.prisma.booking.update({
            where: { id: booking.id },
            data: {
                status: client_1.BookingStatus.CANCELLED,
                cancellationReason: reason,
            },
            include: bookingWithItems,
        });
        this.calendarService.syncBookingCancelled(updated.id);
        this.emailService.sendCancellation(updated.id);
        return updated;
    }
    async rescheduleByToken(token, dto) {
        const booking = await this.findByToken(token);
        this.assertEditWindow(booking);
        if (booking.status !== client_1.BookingStatus.CONFIRMED) {
            throw new common_1.BadRequestException('Only confirmed bookings can be rescheduled.');
        }
        const newStart = new Date(dto.startTime);
        const newEnd = new Date(newStart.getTime() + booking.durationMinutes * 60_000);
        const updated = await this.prisma.$transaction(async (tx) => {
            const isAvailable = await this.availabilityService.isSlotAvailable(newStart, newEnd, booking.id, tx);
            if (!isAvailable) {
                throw new common_1.ConflictException('The new time slot is not available. Please choose a different time.');
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
    async findAll(query) {
        const page = query.page ?? 1;
        const limit = query.limit ?? 20;
        const search = query.search?.trim() ?? '';
        const searchLower = search.toLowerCase();
        const normalizedSearch = search.replace(/[^a-z0-9]/gi, '').toLowerCase();
        const whereBase = {
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
        };
        if (!search) {
            const [data, total] = await this.prisma.$transaction([
                this.prisma.booking.findMany({
                    where: whereBase,
                    include: bookingWithItems,
                    orderBy: { startTime: 'desc' },
                    skip: (page - 1) * limit,
                    take: limit,
                }),
                this.prisma.booking.count({ where: whereBase }),
            ]);
            return {
                data,
                meta: { total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) },
            };
        }
        const allCandidates = await this.prisma.booking.findMany({
            where: whereBase,
            include: bookingWithItems,
            orderBy: { startTime: 'desc' },
        });
        const filtered = allCandidates.filter((booking) => {
            const clientName = booking.clientName.toLowerCase();
            const clientEmail = booking.clientEmail.toLowerCase();
            const token = booking.manageToken.toLowerCase();
            const normalizedToken = booking.manageToken
                .replace(/[^a-z0-9]/gi, '')
                .toLowerCase();
            return (clientName.includes(searchLower) ||
                clientEmail.includes(searchLower) ||
                token.includes(searchLower) ||
                (normalizedSearch.length > 0 && normalizedToken.includes(normalizedSearch)));
        });
        const total = filtered.length;
        const data = filtered.slice((page - 1) * limit, page * limit);
        return {
            data,
            meta: { total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) },
        };
    }
    async findOne(id) {
        const booking = await this.prisma.booking.findUnique({
            where: { id },
            include: bookingWithItems,
        });
        if (!booking)
            throw new common_1.NotFoundException(`Booking ${id} not found`);
        return booking;
    }
    async updateStatus(id, dto) {
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
        if (dto.status === client_1.BookingStatus.CANCELLED &&
            existing.status !== client_1.BookingStatus.CANCELLED) {
            this.calendarService.syncBookingCancelled(updated.id);
            this.emailService.sendCancellation(updated.id);
        }
        return updated;
    }
    assertEditWindow(booking) {
        const hoursUntilStart = booking.startTime.getTime() - Date.now();
        if (hoursUntilStart < TWENTY_FOUR_HOURS_MS) {
            throw new common_1.ForbiddenException('Bookings cannot be changed within 24 hours of the appointment.');
        }
    }
};
exports.BookingsService = BookingsService;
exports.BookingsService = BookingsService = BookingsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        availability_service_1.AvailabilityService,
        calendar_service_js_1.CalendarService,
        email_service_1.EmailService])
], BookingsService);
//# sourceMappingURL=bookings.service.js.map