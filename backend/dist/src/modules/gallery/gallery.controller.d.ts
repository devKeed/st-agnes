import { GalleryService } from './gallery.service';
import { CreateGalleryDto, QueryGalleryDto, ReorderGalleryDto, UpdateGalleryDto } from './dto';
export declare class GalleryController {
    private readonly galleryService;
    constructor(galleryService: GalleryService);
    listPublic(query: QueryGalleryDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        title: string;
        isVisible: boolean;
        sortOrder: number;
        category: import("@prisma/client").$Enums.GalleryCategory;
        imageUrl: string;
        imagePublicId: string | null;
    }[]>;
    listAdmin(query: QueryGalleryDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        title: string;
        isVisible: boolean;
        sortOrder: number;
        category: import("@prisma/client").$Enums.GalleryCategory;
        imageUrl: string;
        imagePublicId: string | null;
    }[]>;
    create(dto: CreateGalleryDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        title: string;
        isVisible: boolean;
        sortOrder: number;
        category: import("@prisma/client").$Enums.GalleryCategory;
        imageUrl: string;
        imagePublicId: string | null;
    }>;
    reorder(dto: ReorderGalleryDto): Promise<{
        updated: number;
    }>;
    getPublic(id: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        title: string;
        isVisible: boolean;
        sortOrder: number;
        category: import("@prisma/client").$Enums.GalleryCategory;
        imageUrl: string;
        imagePublicId: string | null;
    }>;
    update(id: string, dto: UpdateGalleryDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        title: string;
        isVisible: boolean;
        sortOrder: number;
        category: import("@prisma/client").$Enums.GalleryCategory;
        imageUrl: string;
        imagePublicId: string | null;
    }>;
    remove(id: string): Promise<{
        id: string;
    }>;
}
