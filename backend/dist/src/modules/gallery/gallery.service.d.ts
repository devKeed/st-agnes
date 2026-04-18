import { GalleryItem } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { UploadService } from '../upload/upload.service';
import { CreateGalleryDto, QueryGalleryDto, ReorderGalleryDto, UpdateGalleryDto } from './dto';
export declare class GalleryService {
    private readonly prisma;
    private readonly uploadService;
    private readonly logger;
    constructor(prisma: PrismaService, uploadService: UploadService);
    create(dto: CreateGalleryDto): Promise<GalleryItem>;
    findAll(query: QueryGalleryDto, options: {
        isAdmin: boolean;
    }): Promise<GalleryItem[]>;
    findOne(id: string, options: {
        isAdmin: boolean;
    }): Promise<GalleryItem>;
    update(id: string, dto: UpdateGalleryDto): Promise<GalleryItem>;
    remove(id: string): Promise<{
        id: string;
    }>;
    reorder(dto: ReorderGalleryDto): Promise<{
        updated: number;
    }>;
    private bestEffortDeleteFromCdn;
}
