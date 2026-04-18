import { ServiceType } from '@prisma/client';
export declare class RentalItemDto {
    rentalProductId: string;
    selectedSize?: string;
}
export declare class CreateBookingDto {
    clientName: string;
    clientEmail: string;
    clientPhone?: string;
    serviceType: ServiceType;
    startTime: string;
    notes?: string;
    specialRequests?: string;
    rentalItems?: RentalItemDto[];
    termsAccepted: boolean;
    termsVersionId: string;
}
