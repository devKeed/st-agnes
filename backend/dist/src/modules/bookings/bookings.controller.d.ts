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
                description: string | null;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                status: import("@prisma/client").$Enums.RentalStatus;
                sizes: string[];
                pricePerDay: import("@prisma/client-runtime-utils").Decimal;
                depositAmount: import("@prisma/client-runtime-utils").Decimal;
                imageUrls: string[];
                imagePublicIds: string[];
                isVisible: boolean;
                quantity: number;
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
        serviceType: import("@prisma/client").$Enums.ServiceType;
        durationMinutes: number;
        createdAt: Date;
        updatedAt: Date;
        startTime: Date;
        endTime: Date;
        googleEventId: string | null;
        clientName: string;
        clientEmail: string;
        clientPhone: string | null;
        notes: string | null;
        specialRequests: string | null;
        status: import("@prisma/client").$Enums.BookingStatus;
        manageToken: string;
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
                description: string | null;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                status: import("@prisma/client").$Enums.RentalStatus;
                sizes: string[];
                pricePerDay: import("@prisma/client-runtime-utils").Decimal;
                depositAmount: import("@prisma/client-runtime-utils").Decimal;
                imageUrls: string[];
                imagePublicIds: string[];
                isVisible: boolean;
                quantity: number;
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
        serviceType: import("@prisma/client").$Enums.ServiceType;
        durationMinutes: number;
        createdAt: Date;
        updatedAt: Date;
        startTime: Date;
        endTime: Date;
        googleEventId: string | null;
        clientName: string;
        clientEmail: string;
        clientPhone: string | null;
        notes: string | null;
        specialRequests: string | null;
        status: import("@prisma/client").$Enums.BookingStatus;
        manageToken: string;
        termsVersionId: string | null;
        termsAccepted: boolean;
        termsAcceptedAt: Date | null;
        cancellationReason: string | null;
    }>;
    rescheduleByToken(token: string, dto: RescheduleBookingDto): Promise<{
        bookingItems: ({
            rentalProduct: {
                id: string;
                description: string | null;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                status: import("@prisma/client").$Enums.RentalStatus;
                sizes: string[];
                pricePerDay: import("@prisma/client-runtime-utils").Decimal;
                depositAmount: import("@prisma/client-runtime-utils").Decimal;
                imageUrls: string[];
                imagePublicIds: string[];
                isVisible: boolean;
                quantity: number;
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
        serviceType: import("@prisma/client").$Enums.ServiceType;
        durationMinutes: number;
        createdAt: Date;
        updatedAt: Date;
        startTime: Date;
        endTime: Date;
        googleEventId: string | null;
        clientName: string;
        clientEmail: string;
        clientPhone: string | null;
        notes: string | null;
        specialRequests: string | null;
        status: import("@prisma/client").$Enums.BookingStatus;
        manageToken: string;
        termsVersionId: string | null;
        termsAccepted: boolean;
        termsAcceptedAt: Date | null;
        cancellationReason: string | null;
    }>;
    recoverBookings(dto: RecoverBookingDto): Promise<void>;
    listAll(query: QueryBookingsDto): Promise<import("../../common/dto").PaginatedResponse<{
        bookingItems: ({
            rentalProduct: {
                id: string;
                description: string | null;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                status: import("@prisma/client").$Enums.RentalStatus;
                sizes: string[];
                pricePerDay: import("@prisma/client-runtime-utils").Decimal;
                depositAmount: import("@prisma/client-runtime-utils").Decimal;
                imageUrls: string[];
                imagePublicIds: string[];
                isVisible: boolean;
                quantity: number;
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
        serviceType: import("@prisma/client").$Enums.ServiceType;
        durationMinutes: number;
        createdAt: Date;
        updatedAt: Date;
        startTime: Date;
        endTime: Date;
        googleEventId: string | null;
        clientName: string;
        clientEmail: string;
        clientPhone: string | null;
        notes: string | null;
        specialRequests: string | null;
        status: import("@prisma/client").$Enums.BookingStatus;
        manageToken: string;
        termsVersionId: string | null;
        termsAccepted: boolean;
        termsAcceptedAt: Date | null;
        cancellationReason: string | null;
    }>>;
    getOne(id: string): Promise<{
        bookingItems: ({
            rentalProduct: {
                id: string;
                description: string | null;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                status: import("@prisma/client").$Enums.RentalStatus;
                sizes: string[];
                pricePerDay: import("@prisma/client-runtime-utils").Decimal;
                depositAmount: import("@prisma/client-runtime-utils").Decimal;
                imageUrls: string[];
                imagePublicIds: string[];
                isVisible: boolean;
                quantity: number;
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
        serviceType: import("@prisma/client").$Enums.ServiceType;
        durationMinutes: number;
        createdAt: Date;
        updatedAt: Date;
        startTime: Date;
        endTime: Date;
        googleEventId: string | null;
        clientName: string;
        clientEmail: string;
        clientPhone: string | null;
        notes: string | null;
        specialRequests: string | null;
        status: import("@prisma/client").$Enums.BookingStatus;
        manageToken: string;
        termsVersionId: string | null;
        termsAccepted: boolean;
        termsAcceptedAt: Date | null;
        cancellationReason: string | null;
    }>;
    updateStatus(id: string, dto: UpdateBookingStatusDto): Promise<{
        bookingItems: ({
            rentalProduct: {
                id: string;
                description: string | null;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                status: import("@prisma/client").$Enums.RentalStatus;
                sizes: string[];
                pricePerDay: import("@prisma/client-runtime-utils").Decimal;
                depositAmount: import("@prisma/client-runtime-utils").Decimal;
                imageUrls: string[];
                imagePublicIds: string[];
                isVisible: boolean;
                quantity: number;
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
        serviceType: import("@prisma/client").$Enums.ServiceType;
        durationMinutes: number;
        createdAt: Date;
        updatedAt: Date;
        startTime: Date;
        endTime: Date;
        googleEventId: string | null;
        clientName: string;
        clientEmail: string;
        clientPhone: string | null;
        notes: string | null;
        specialRequests: string | null;
        status: import("@prisma/client").$Enums.BookingStatus;
        manageToken: string;
        termsVersionId: string | null;
        termsAccepted: boolean;
        termsAcceptedAt: Date | null;
        cancellationReason: string | null;
    }>;
}
