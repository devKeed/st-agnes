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
                id: string;
                name: string;
                createdAt: Date;
                updatedAt: Date;
                description: string | null;
                sizes: string[];
                pricePerDay: import("@prisma/client-runtime-utils").Decimal;
                depositAmount: import("@prisma/client-runtime-utils").Decimal;
                imageUrls: string[];
                imagePublicIds: string[];
                status: import("@prisma/client").$Enums.RentalStatus;
                isVisible: boolean;
                sortOrder: number;
            };
        } & {
            id: string;
            createdAt: Date;
            selectedSize: string | null;
            bookingId: string;
            rentalProductId: string;
        })[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        serviceType: import("@prisma/client").$Enums.ServiceType;
        durationMinutes: number;
        status: import("@prisma/client").$Enums.BookingStatus;
        clientName: string;
        clientEmail: string;
        clientPhone: string | null;
        startTime: Date;
        endTime: Date;
        notes: string | null;
        specialRequests: string | null;
        manageToken: string;
        googleEventId: string | null;
        termsVersionId: string | null;
        termsAccepted: boolean;
        termsAcceptedAt: Date | null;
        cancellationReason: string | null;
    }>;
    cancelByToken(token: string, body: {
        reason?: string;
    }): Promise<{
        bookingItems: ({
            rentalProduct: {
                id: string;
                name: string;
                createdAt: Date;
                updatedAt: Date;
                description: string | null;
                sizes: string[];
                pricePerDay: import("@prisma/client-runtime-utils").Decimal;
                depositAmount: import("@prisma/client-runtime-utils").Decimal;
                imageUrls: string[];
                imagePublicIds: string[];
                status: import("@prisma/client").$Enums.RentalStatus;
                isVisible: boolean;
                sortOrder: number;
            };
        } & {
            id: string;
            createdAt: Date;
            selectedSize: string | null;
            bookingId: string;
            rentalProductId: string;
        })[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        serviceType: import("@prisma/client").$Enums.ServiceType;
        durationMinutes: number;
        status: import("@prisma/client").$Enums.BookingStatus;
        clientName: string;
        clientEmail: string;
        clientPhone: string | null;
        startTime: Date;
        endTime: Date;
        notes: string | null;
        specialRequests: string | null;
        manageToken: string;
        googleEventId: string | null;
        termsVersionId: string | null;
        termsAccepted: boolean;
        termsAcceptedAt: Date | null;
        cancellationReason: string | null;
    }>;
    rescheduleByToken(token: string, dto: RescheduleBookingDto): Promise<{
        bookingItems: ({
            rentalProduct: {
                id: string;
                name: string;
                createdAt: Date;
                updatedAt: Date;
                description: string | null;
                sizes: string[];
                pricePerDay: import("@prisma/client-runtime-utils").Decimal;
                depositAmount: import("@prisma/client-runtime-utils").Decimal;
                imageUrls: string[];
                imagePublicIds: string[];
                status: import("@prisma/client").$Enums.RentalStatus;
                isVisible: boolean;
                sortOrder: number;
            };
        } & {
            id: string;
            createdAt: Date;
            selectedSize: string | null;
            bookingId: string;
            rentalProductId: string;
        })[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        serviceType: import("@prisma/client").$Enums.ServiceType;
        durationMinutes: number;
        status: import("@prisma/client").$Enums.BookingStatus;
        clientName: string;
        clientEmail: string;
        clientPhone: string | null;
        startTime: Date;
        endTime: Date;
        notes: string | null;
        specialRequests: string | null;
        manageToken: string;
        googleEventId: string | null;
        termsVersionId: string | null;
        termsAccepted: boolean;
        termsAcceptedAt: Date | null;
        cancellationReason: string | null;
    }>;
    listAll(query: QueryBookingsDto): Promise<import("../../common/dto").PaginatedResponse<{
        bookingItems: ({
            rentalProduct: {
                id: string;
                name: string;
                createdAt: Date;
                updatedAt: Date;
                description: string | null;
                sizes: string[];
                pricePerDay: import("@prisma/client-runtime-utils").Decimal;
                depositAmount: import("@prisma/client-runtime-utils").Decimal;
                imageUrls: string[];
                imagePublicIds: string[];
                status: import("@prisma/client").$Enums.RentalStatus;
                isVisible: boolean;
                sortOrder: number;
            };
        } & {
            id: string;
            createdAt: Date;
            selectedSize: string | null;
            bookingId: string;
            rentalProductId: string;
        })[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        serviceType: import("@prisma/client").$Enums.ServiceType;
        durationMinutes: number;
        status: import("@prisma/client").$Enums.BookingStatus;
        clientName: string;
        clientEmail: string;
        clientPhone: string | null;
        startTime: Date;
        endTime: Date;
        notes: string | null;
        specialRequests: string | null;
        manageToken: string;
        googleEventId: string | null;
        termsVersionId: string | null;
        termsAccepted: boolean;
        termsAcceptedAt: Date | null;
        cancellationReason: string | null;
    }>>;
    getOne(id: string): Promise<{
        bookingItems: ({
            rentalProduct: {
                id: string;
                name: string;
                createdAt: Date;
                updatedAt: Date;
                description: string | null;
                sizes: string[];
                pricePerDay: import("@prisma/client-runtime-utils").Decimal;
                depositAmount: import("@prisma/client-runtime-utils").Decimal;
                imageUrls: string[];
                imagePublicIds: string[];
                status: import("@prisma/client").$Enums.RentalStatus;
                isVisible: boolean;
                sortOrder: number;
            };
        } & {
            id: string;
            createdAt: Date;
            selectedSize: string | null;
            bookingId: string;
            rentalProductId: string;
        })[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        serviceType: import("@prisma/client").$Enums.ServiceType;
        durationMinutes: number;
        status: import("@prisma/client").$Enums.BookingStatus;
        clientName: string;
        clientEmail: string;
        clientPhone: string | null;
        startTime: Date;
        endTime: Date;
        notes: string | null;
        specialRequests: string | null;
        manageToken: string;
        googleEventId: string | null;
        termsVersionId: string | null;
        termsAccepted: boolean;
        termsAcceptedAt: Date | null;
        cancellationReason: string | null;
    }>;
    updateStatus(id: string, dto: UpdateBookingStatusDto): Promise<{
        bookingItems: ({
            rentalProduct: {
                id: string;
                name: string;
                createdAt: Date;
                updatedAt: Date;
                description: string | null;
                sizes: string[];
                pricePerDay: import("@prisma/client-runtime-utils").Decimal;
                depositAmount: import("@prisma/client-runtime-utils").Decimal;
                imageUrls: string[];
                imagePublicIds: string[];
                status: import("@prisma/client").$Enums.RentalStatus;
                isVisible: boolean;
                sortOrder: number;
            };
        } & {
            id: string;
            createdAt: Date;
            selectedSize: string | null;
            bookingId: string;
            rentalProductId: string;
        })[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        serviceType: import("@prisma/client").$Enums.ServiceType;
        durationMinutes: number;
        status: import("@prisma/client").$Enums.BookingStatus;
        clientName: string;
        clientEmail: string;
        clientPhone: string | null;
        startTime: Date;
        endTime: Date;
        notes: string | null;
        specialRequests: string | null;
        manageToken: string;
        googleEventId: string | null;
        termsVersionId: string | null;
        termsAccepted: boolean;
        termsAcceptedAt: Date | null;
        cancellationReason: string | null;
    }>;
}
