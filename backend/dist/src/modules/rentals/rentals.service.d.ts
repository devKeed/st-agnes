import { RentalProduct } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { UploadService } from '../upload/upload.service';
import { CreateRentalDto, QueryRentalsDto, UpdateRentalDto } from './dto';
import type { PaginatedResponse } from '../../common/dto';
export declare class RentalsService {
    private readonly prisma;
    private readonly uploadService;
    private readonly logger;
    constructor(prisma: PrismaService, uploadService: UploadService);
    create(dto: CreateRentalDto): Promise<RentalProduct>;
    findAll(query: QueryRentalsDto, options: {
        isAdmin: boolean;
    }): Promise<PaginatedResponse<RentalProduct & {
        availableCount?: number;
    }>>;
    findOne(id: string, options: {
        isAdmin: boolean;
    }): Promise<RentalProduct>;
    update(id: string, dto: UpdateRentalDto): Promise<RentalProduct>;
    remove(id: string): Promise<RentalProduct>;
    private assertImageArraysAligned;
    private bestEffortDeleteFromCdn;
}
