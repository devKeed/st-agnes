import { GalleryCategory } from '@prisma/client';
export declare class QueryGalleryDto {
    category?: GalleryCategory;
    includeHidden?: string;
}
