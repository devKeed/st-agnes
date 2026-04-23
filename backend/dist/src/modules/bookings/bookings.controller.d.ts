import { BookingsService } from './bookings.service';
import { CreateBookingDto, QueryBookingsDto, RescheduleBookingDto, UpdateBookingStatusDto } from './dto';
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
                name: string;
                id: string;
                status: import("@prisma/client").$Enums.RentalStatus;
                createdAt: Date;
                updatedAt: Date;
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
            selectedSize: string | null;
            rentalProductId: string;
            bookingId: string;
        })[];
    } & {
        id: string;
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
        manageToken: string;
        googleEventId: string | null;
        termsVersionId: string | null;
        termsAccepted: boolean;
        termsAcceptedAt: Date | null;
        cancellationReason: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    cancelByToken(token: string, body: {
        reason?: string;
    }): Promise<{
        bookingItems: ({
            rentalProduct: {
                name: string;
                id: string;
                status: import("@prisma/client").$Enums.RentalStatus;
                createdAt: Date;
                updatedAt: Date;
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
            selectedSize: string | null;
            rentalProductId: string;
            bookingId: string;
        })[];
    } & {
        id: string;
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
        manageToken: string;
        googleEventId: string | null;
        termsVersionId: string | null;
        termsAccepted: boolean;
        termsAcceptedAt: Date | null;
        cancellationReason: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    rescheduleByToken(token: string, dto: RescheduleBookingDto): Promise<{
        bookingItems: ({
            rentalProduct: {
                name: string;
                id: string;
                status: import("@prisma/client").$Enums.RentalStatus;
                createdAt: Date;
                updatedAt: Date;
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
            selectedSize: string | null;
            rentalProductId: string;
            bookingId: string;
        })[];
    } & {
        id: string;
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
        manageToken: string;
        googleEventId: string | null;
        termsVersionId: string | null;
        termsAccepted: boolean;
        termsAcceptedAt: Date | null;
        cancellationReason: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    listAll(query: QueryBookingsDto): Promise<import("../../common/dto").PaginatedResponse<{
        bookingItems: ({
            rentalProduct: {
                name: string;
                id: string;
                status: import("@prisma/client").$Enums.RentalStatus;
                createdAt: Date;
                updatedAt: Date;
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
            selectedSize: string | null;
            rentalProductId: string;
            bookingId: string;
        })[];
    } & {
        id: string;
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
        manageToken: string;
        googleEventId: string | null;
        termsVersionId: string | null;
        termsAccepted: boolean;
        termsAcceptedAt: Date | null;
        cancellationReason: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>>;
    getOne(id: string): Promise<{
        bookingItems: ({
            rentalProduct: {
                name: string;
                id: string;
                status: import("@prisma/client").$Enums.RentalStatus;
                createdAt: Date;
                updatedAt: Date;
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
            selectedSize: string | null;
            rentalProductId: string;
            bookingId: string;
        })[];
    } & {
        id: string;
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
        manageToken: string;
        googleEventId: string | null;
        termsVersionId: string | null;
        termsAccepted: boolean;
        termsAcceptedAt: Date | null;
        cancellationReason: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    updateStatus(id: string, dto: UpdateBookingStatusDto): Promise<{
        bookingItems: ({
            rentalProduct: {
                name: string;
                id: string;
                status: import("@prisma/client").$Enums.RentalStatus;
                createdAt: Date;
                updatedAt: Date;
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
            selectedSize: string | null;
            rentalProductId: string;
            bookingId: string;
        })[];
    } & {
        id: string;
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
        manageToken: string;
        googleEventId: string | null;
        termsVersionId: string | null;
        termsAccepted: boolean;
        termsAcceptedAt: Date | null;
        cancellationReason: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
}
