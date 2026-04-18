import { SiteContent } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { UpsertContentDto } from './dto';
export declare class ContentService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findAll(): Promise<SiteContent[]>;
    findOne(key: string): Promise<SiteContent>;
    upsert(key: string, dto: UpsertContentDto, updatedById: string): Promise<SiteContent>;
}
