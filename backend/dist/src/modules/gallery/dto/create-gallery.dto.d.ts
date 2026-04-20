import { GalleryCategory } from '@prisma/client';
export declare class CreateGalleryDto {
    category: GalleryCategory;
    title: string;
    description?: string;
    imageUrl: string;
    imagePublicId?: string;
    sortOrder?: number;
    isVisible?: boolean;
}
