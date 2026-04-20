import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AvailabilityService } from '../availability/availability.service';
import { CalendarService } from '../calendar/calendar.service.js';
import { EmailService } from '../email/email.service';
import { CreateBookingDto, QueryBookingsDto, RescheduleBookingDto, UpdateBookingStatusDto } from './dto';
import type { PaginatedResponse } from '../../common/dto';
declare const bookingWithItems: {
    bookingItems: {
        include: {
            rentalProduct: true;
        };
    };
};
type BookingWithItems = Prisma.BookingGetPayload<{
    include: typeof bookingWithItems;
}>;
export declare class BookingsService {
    private readonly prisma;
    private readonly availabilityService;
    private readonly calendarService;
    private readonly emailService;
    private readonly logger;
    constructor(prisma: PrismaService, availabilityService: AvailabilityService, calendarService: CalendarService, emailService: EmailService);
    create(dto: CreateBookingDto): Promise<{
        booking: BookingWithItems;
        manageUrl: string;
    }>;
    findByToken(token: string): Promise<BookingWithItems>;
    cancelByToken(token: string, reason?: string): Promise<BookingWithItems>;
    rescheduleByToken(token: string, dto: RescheduleBookingDto): Promise<BookingWithItems>;
    findAll(query: QueryBookingsDto): Promise<PaginatedResponse<BookingWithItems>>;
    findOne(id: string): Promise<BookingWithItems>;
    updateStatus(id: string, dto: UpdateBookingStatusDto): Promise<BookingWithItems>;
    private assertEditWindow;
}
export {};
