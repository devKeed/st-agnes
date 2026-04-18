import { TermsService } from './terms.service';
import { CreateTermsDto } from './dto';
export declare class TermsController {
    private readonly termsService;
    constructor(termsService: TermsService);
    getActive(): Promise<{
        id: string;
        isActive: boolean;
        createdAt: Date;
        versionLabel: string;
        content: string;
        publishedAt: Date | null;
        createdById: string | null;
    }>;
    listAll(): Promise<{
        id: string;
        isActive: boolean;
        createdAt: Date;
        versionLabel: string;
        content: string;
        publishedAt: Date | null;
        createdById: string | null;
    }[]>;
    create(dto: CreateTermsDto, userId: string): Promise<{
        id: string;
        isActive: boolean;
        createdAt: Date;
        versionLabel: string;
        content: string;
        publishedAt: Date | null;
        createdById: string | null;
    }>;
    activate(id: string): Promise<{
        id: string;
        isActive: boolean;
        createdAt: Date;
        versionLabel: string;
        content: string;
        publishedAt: Date | null;
        createdById: string | null;
    }>;
}
