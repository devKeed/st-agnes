import { RentalStatus } from '@prisma/client';
export declare class CreateRentalDto {
    name: string;
    description?: string;
    sizes: string[];
    pricePerDay: number;
    depositAmount?: number;
    imageUrls: string[];
    imagePublicIds: string[];
    status?: RentalStatus;
    isVisible?: boolean;
    sortOrder?: number;
}
