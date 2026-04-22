import { GalleryService } from './gallery.service';
import { CreateGalleryDto, QueryGalleryDto, ReorderGalleryDto, UpdateGalleryDto } from './dto';
export declare class GalleryController {
    private readonly galleryService;
    constructor(galleryService: GalleryService);
    listPublic(query: QueryGalleryDto): Promise<{
        description: string | null;
        title: string;
        category: import("@prisma/client").$Enums.GalleryCategory;
        imageUrl: string;
        imagePublicId: string | null;
        sortOrder: number;
        isVisible: boolean;
        id: string;
        createdAt: Date;
        updatedAt: Date;
    }[]>;
    listAdmin(query: QueryGalleryDto): Promise<{
        description: string | null;
        title: string;
        category: import("@prisma/client").$Enums.GalleryCategory;
        imageUrl: string;
        imagePublicId: string | null;
        sortOrder: number;
        isVisible: boolean;
        id: string;
        createdAt: Date;
        updatedAt: Date;
    }[]>;
    create(dto: CreateGalleryDto): Promise<{
        description: string | null;
        title: string;
        category: import("@prisma/client").$Enums.GalleryCategory;
        imageUrl: string;
        imagePublicId: string | null;
        sortOrder: number;
        isVisible: boolean;
        id: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    reorder(dto: ReorderGalleryDto): Promise<{
        updated: number;
    }>;
    getPublic(id: string): Promise<{
        description: string | null;
        title: string;
        category: import("@prisma/client").$Enums.GalleryCategory;
        imageUrl: string;
        imagePublicId: string | null;
        sortOrder: number;
        isVisible: boolean;
        id: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    update(id: string, dto: UpdateGalleryDto): Promise<{
        description: string | null;
        title: string;
        category: import("@prisma/client").$Enums.GalleryCategory;
        imageUrl: string;
        imagePublicId: string | null;
        sortOrder: number;
        isVisible: boolean;
        id: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    remove(id: string): Promise<{
        id: string;
    }>;
}
