import { TermsVersion } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTermsDto } from './dto';
export declare class TermsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getActive(): Promise<TermsVersion>;
    listAll(): Promise<TermsVersion[]>;
    create(dto: CreateTermsDto, createdById: string): Promise<TermsVersion>;
    activate(id: string): Promise<TermsVersion>;
}
