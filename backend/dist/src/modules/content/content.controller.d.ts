import { ContentService } from './content.service';
import { UpsertContentDto } from './dto';
export declare class ContentController {
    private readonly contentService;
    constructor(contentService: ContentService);
    list(): Promise<{
        id: string;
        updatedAt: Date;
        pageKey: string;
        contentType: import("@prisma/client").$Enums.ContentType;
        value: string;
        updatedById: string | null;
    }[]>;
    get(key: string): Promise<{
        id: string;
        updatedAt: Date;
        pageKey: string;
        contentType: import("@prisma/client").$Enums.ContentType;
        value: string;
        updatedById: string | null;
    }>;
    upsert(key: string, dto: UpsertContentDto, userId: string): Promise<{
        id: string;
        updatedAt: Date;
        pageKey: string;
        contentType: import("@prisma/client").$Enums.ContentType;
        value: string;
        updatedById: string | null;
    }>;
}
