import { BookingsService } from './bookings.service';
import { CreateBookingDto, QueryBookingsDto, RecoverBookingDto, RescheduleBookingDto, UpdateBookingStatusDto } from './dto';
export declare class BookingsController {
    private readonly bookingsService;
    constructor(bookingsService: BookingsService);
    create(dto: CreateBookingDto): Promise<{
        id: string;
        status: import("@prisma/client").$Enums.BookingStatus;
        manageToken: string;
        manageUrl: string;
        startTime: Date;
        endTime: Date;
        serviceType: import("@prisma/client").$Enums.ServiceType;
        message: string;
    }>;
    getByToken(token: string): Promise<{
        bookingItems: ({
            rentalProduct: {
                id: string;
                updatedAt: Date;
                name: string;
                status: import("@prisma/client").$Enums.RentalStatus;
                createdAt: Date;
                description: string | null;
                sizes: string[];
                pricePerDay: import("@prisma/client-runtime-utils").Decimal;
                depositAmount: import("@prisma/client-runtime-utils").Decimal;
                imageUrls: string[];
                imagePublicIds: string[];
                isVisible: boolean;
                sortOrder: number;
            };
        } & {
            id: string;
            createdAt: Date;
            bookingId: string;
            selectedSize: string | null;
            rentalProductId: string;
        })[];
    } & {
        id: string;
        updatedAt: Date;
        manageToken: string;
        clientName: string;
        clientEmail: string;
        clientPhone: string | null;
        serviceType: import("@prisma/client").$Enums.ServiceType;
        durationMinutes: number;
        startTime: Date;
        endTime: Date;
        notes: string | null;
        specialRequests: string | null;
        status: import("@prisma/client").$Enums.BookingStatus;
        googleEventId: string | null;
        termsVersionId: string | null;
        termsAccepted: boolean;
        termsAcceptedAt: Date | null;
        cancellationReason: string | null;
        createdAt: Date;
    }>;
    cancelByToken(token: string, body: {
        reason?: string;
    }): Promise<{
        bookingItems: ({
            rentalProduct: {
                id: string;
                updatedAt: Date;
                name: string;
                status: import("@prisma/client").$Enums.RentalStatus;
                createdAt: Date;
                description: string | null;
                sizes: string[];
                pricePerDay: import("@prisma/client-runtime-utils").Decimal;
                depositAmount: import("@prisma/client-runtime-utils").Decimal;
                imageUrls: string[];
                imagePublicIds: string[];
                isVisible: boolean;
                sortOrder: number;
            };
        } & {
            id: string;
            createdAt: Date;
            bookingId: string;
            selectedSize: string | null;
            rentalProductId: string;
        })[];
    } & {
        id: string;
        updatedAt: Date;
        manageToken: string;
        clientName: string;
        clientEmail: string;
        clientPhone: string | null;
        serviceType: import("@prisma/client").$Enums.ServiceType;
        durationMinutes: number;
        startTime: Date;
        endTime: Date;
        notes: string | null;
        specialRequests: string | null;
        status: import("@prisma/client").$Enums.BookingStatus;
        googleEventId: string | null;
        termsVersionId: string | null;
        termsAccepted: boolean;
        termsAcceptedAt: Date | null;
        cancellationReason: string | null;
        createdAt: Date;
    }>;
    rescheduleByToken(token: string, dto: RescheduleBookingDto): Promise<{
        bookingItems: ({
            rentalProduct: {
                id: string;
                updatedAt: Date;
                name: string;
                status: import("@prisma/client").$Enums.RentalStatus;
                createdAt: Date;
                description: string | null;
                sizes: string[];
                pricePerDay: import("@prisma/client-runtime-utils").Decimal;
                depositAmount: import("@prisma/client-runtime-utils").Decimal;
                imageUrls: string[];
                imagePublicIds: string[];
                isVisible: boolean;
                sortOrder: number;
            };
        } & {
            id: string;
            createdAt: Date;
            bookingId: string;
            selectedSize: string | null;
            rentalProductId: string;
        })[];
    } & {
        id: string;
        updatedAt: Date;
        manageToken: string;
        clientName: string;
        clientEmail: string;
        clientPhone: string | null;
        serviceType: import("@prisma/client").$Enums.ServiceType;
        durationMinutes: number;
        startTime: Date;
        endTime: Date;
        notes: string | null;
        specialRequests: string | null;
        status: import("@prisma/client").$Enums.BookingStatus;
        googleEventId: string | null;
        termsVersionId: string | null;
        termsAccepted: boolean;
        termsAcceptedAt: Date | null;
        cancellationReason: string | null;
        createdAt: Date;
    }>;
    recoverBookings(dto: RecoverBookingDto): Promise<void>;
    listAll(query: QueryBookingsDto): Promise<import("../../common/dto").PaginatedResponse<{
        bookingItems: ({
            rentalProduct: {
                id: string;
                updatedAt: Date;
                name: string;
                status: import("@prisma/client").$Enums.RentalStatus;
                createdAt: Date;
                description: string | null;
                sizes: string[];
                pricePerDay: import("@prisma/client-runtime-utils").Decimal;
                depositAmount: import("@prisma/client-runtime-utils").Decimal;
                imageUrls: string[];
                imagePublicIds: string[];
                isVisible: boolean;
                sortOrder: number;
            };
        } & {
            id: string;
            createdAt: Date;
            bookingId: string;
            selectedSize: string | null;
            rentalProductId: string;
        })[];
    } & {
        id: string;
        updatedAt: Date;
        manageToken: string;
        clientName: string;
        clientEmail: string;
        clientPhone: string | null;
        serviceType: import("@prisma/client").$Enums.ServiceType;
        durationMinutes: number;
        startTime: Date;
        endTime: Date;
        notes: string | null;
        specialRequests: string | null;
        status: import("@prisma/client").$Enums.BookingStatus;
        googleEventId: string | null;
        termsVersionId: string | null;
        termsAccepted: boolean;
        termsAcceptedAt: Date | null;
        cancellationReason: string | null;
        createdAt: Date;
    }>>;
    getOne(id: string): Promise<{
        bookingItems: ({
            rentalProduct: {
                id: string;
                updatedAt: Date;
                name: string;
                status: import("@prisma/client").$Enums.RentalStatus;
                createdAt: Date;
                description: string | null;
                sizes: string[];
                pricePerDay: import("@prisma/client-runtime-utils").Decimal;
                depositAmount: import("@prisma/client-runtime-utils").Decimal;
                imageUrls: string[];
                imagePublicIds: string[];
                isVisible: boolean;
                sortOrder: number;
            };
        } & {
            id: string;
            createdAt: Date;
            bookingId: string;
            selectedSize: string | null;
            rentalProductId: string;
        })[];
    } & {
        id: string;
        updatedAt: Date;
        manageToken: string;
        clientName: string;
        clientEmail: string;
        clientPhone: string | null;
        serviceType: import("@prisma/client").$Enums.ServiceType;
        durationMinutes: number;
        startTime: Date;
        endTime: Date;
        notes: string | null;
        specialRequests: string | null;
        status: import("@prisma/client").$Enums.BookingStatus;
        googleEventId: string | null;
        termsVersionId: string | null;
        termsAccepted: boolean;
        termsAcceptedAt: Date | null;
        cancellationReason: string | null;
        createdAt: Date;
    }>;
    updateStatus(id: string, dto: UpdateBookingStatusDto): Promise<{
        bookingItems: ({
            rentalProduct: {
                id: string;
                updatedAt: Date;
                name: string;
                status: import("@prisma/client").$Enums.RentalStatus;
                createdAt: Date;
                description: string | null;
                sizes: string[];
                pricePerDay: import("@prisma/client-runtime-utils").Decimal;
                depositAmount: import("@prisma/client-runtime-utils").Decimal;
                imageUrls: string[];
                imagePublicIds: string[];
                isVisible: boolean;
                sortOrder: number;
            };
        } & {
            id: string;
            createdAt: Date;
            bookingId: string;
            selectedSize: string | null;
            rentalProductId: string;
        })[];
    } & {
        id: string;
        updatedAt: Date;
        manageToken: string;
        clientName: string;
        clientEmail: string;
        clientPhone: string | null;
        serviceType: import("@prisma/client").$Enums.ServiceType;
        durationMinutes: number;
        startTime: Date;
        endTime: Date;
        notes: string | null;
        specialRequests: string | null;
        status: import("@prisma/client").$Enums.BookingStatus;
        googleEventId: string | null;
        termsVersionId: string | null;
        termsAccepted: boolean;
        termsAcceptedAt: Date | null;
        cancellationReason: string | null;
        createdAt: Date;
    }>;
}
