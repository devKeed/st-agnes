"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var RentalsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RentalsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../prisma/prisma.service");
const upload_service_1 = require("../upload/upload.service");
let RentalsService = RentalsService_1 = class RentalsService {
    prisma;
    uploadService;
    logger = new common_1.Logger(RentalsService_1.name);
    constructor(prisma, uploadService) {
        this.prisma = prisma;
        this.uploadService = uploadService;
    }
    async create(dto) {
        this.assertImageArraysAligned(dto.imageUrls, dto.imagePublicIds);
        return this.prisma.rentalProduct.create({
            data: {
                name: dto.name,
                description: dto.description,
                sizes: dto.sizes,
                pricePerDay: new client_1.Prisma.Decimal(dto.pricePerDay),
                depositAmount: new client_1.Prisma.Decimal(dto.depositAmount ?? 0),
                imageUrls: dto.imageUrls,
                imagePublicIds: dto.imagePublicIds,
                status: dto.status ?? client_1.RentalStatus.AVAILABLE,
                isVisible: dto.isVisible ?? true,
                quantity: dto.quantity ?? 1,
                sortOrder: dto.sortOrder ?? 0,
            },
        });
    }
    async findAll(query, options) {
        const page = query.page ?? 1;
        const limit = query.limit ?? 20;
        const includeHidden = options.isAdmin && query.includeHidden === 'true';
        const where = {
            ...(includeHidden ? {} : { isVisible: true }),
            ...(query.status ? { status: query.status } : {}),
            ...(!options.isAdmin
                ? { status: { not: client_1.RentalStatus.RETIRED } }
                : {}),
            ...(query.search
                ? { name: { contains: query.search, mode: 'insensitive' } }
                : {}),
        };
        const [data, total] = await this.prisma.$transaction([
            this.prisma.rentalProduct.findMany({
                where,
                orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
                skip: (page - 1) * limit,
                take: limit,
            }),
            this.prisma.rentalProduct.count({ where }),
        ]);
        const meta = {
            total,
            page,
            limit,
            totalPages: Math.max(1, Math.ceil(total / limit)),
        };
        if (query.startTime) {
            const start = new Date(query.startTime);
            const end = query.endTime ? new Date(query.endTime) : start;
            if (query.endTime && end <= start) {
                throw new common_1.BadRequestException('endTime must be after startTime.');
            }
            const ids = data.map((p) => p.id);
            const bookingOverlapWhere = query.endTime
                ? {
                    AND: [
                        { startTime: { lt: end } },
                        { endTime: { gt: start } },
                    ],
                }
                : {
                    AND: [
                        { startTime: { lt: start } },
                        { endTime: { gt: start } },
                    ],
                };
            const counts = await this.prisma.bookingItem.groupBy({
                by: ['rentalProductId'],
                where: {
                    rentalProductId: { in: ids },
                    booking: {
                        status: client_1.BookingStatus.CONFIRMED,
                        ...bookingOverlapWhere,
                    },
                },
                _count: { rentalProductId: true },
            });
            const countMap = new Map(counts.map((c) => [c.rentalProductId, c._count.rentalProductId]));
            return {
                data: data.map((p) => ({
                    ...p,
                    availableCount: Math.max(0, p.quantity - (countMap.get(p.id) ?? 0)),
                })),
                meta,
            };
        }
        return { data, meta };
    }
    async findOne(id, options) {
        const rental = await this.prisma.rentalProduct.findUnique({ where: { id } });
        if (!rental) {
            throw new common_1.NotFoundException(`Rental ${id} not found`);
        }
        if (!options.isAdmin && (!rental.isVisible || rental.status === client_1.RentalStatus.RETIRED)) {
            throw new common_1.NotFoundException(`Rental ${id} not found`);
        }
        return rental;
    }
    async update(id, dto) {
        const existing = await this.prisma.rentalProduct.findUnique({ where: { id } });
        if (!existing) {
            throw new common_1.NotFoundException(`Rental ${id} not found`);
        }
        if (dto.quantity !== undefined &&
            dto.quantity < existing.quantity) {
            await this.assertQuantityCanSupportExistingBookings(id, dto.quantity);
        }
        if (dto.imageUrls || dto.imagePublicIds) {
            const nextUrls = dto.imageUrls ?? existing.imageUrls;
            const nextIds = dto.imagePublicIds ?? existing.imagePublicIds;
            this.assertImageArraysAligned(nextUrls, nextIds);
            const removed = existing.imagePublicIds.filter((id) => !nextIds.includes(id));
            await this.bestEffortDeleteFromCdn(removed);
        }
        const data = {
            ...(dto.name !== undefined ? { name: dto.name } : {}),
            ...(dto.description !== undefined ? { description: dto.description } : {}),
            ...(dto.sizes !== undefined ? { sizes: dto.sizes } : {}),
            ...(dto.pricePerDay !== undefined
                ? { pricePerDay: new client_1.Prisma.Decimal(dto.pricePerDay) }
                : {}),
            ...(dto.depositAmount !== undefined
                ? { depositAmount: new client_1.Prisma.Decimal(dto.depositAmount) }
                : {}),
            ...(dto.imageUrls !== undefined ? { imageUrls: dto.imageUrls } : {}),
            ...(dto.imagePublicIds !== undefined
                ? { imagePublicIds: dto.imagePublicIds }
                : {}),
            ...(dto.status !== undefined ? { status: dto.status } : {}),
            ...(dto.isVisible !== undefined ? { isVisible: dto.isVisible } : {}),
            ...(dto.quantity !== undefined ? { quantity: dto.quantity } : {}),
            ...(dto.sortOrder !== undefined ? { sortOrder: dto.sortOrder } : {}),
        };
        return this.prisma.rentalProduct.update({ where: { id }, data });
    }
    async remove(id) {
        const existing = await this.prisma.rentalProduct.findUnique({ where: { id } });
        if (!existing) {
            throw new common_1.NotFoundException(`Rental ${id} not found`);
        }
        return this.prisma.rentalProduct.update({
            where: { id },
            data: {
                status: client_1.RentalStatus.RETIRED,
                isVisible: false,
            },
        });
    }
    assertImageArraysAligned(urls, publicIds) {
        if (urls.length !== publicIds.length) {
            throw new common_1.BadRequestException('imageUrls and imagePublicIds must have the same length (paired by index).');
        }
    }
    async bestEffortDeleteFromCdn(publicIds) {
        for (const publicId of publicIds) {
            try {
                await this.uploadService.deleteImage(publicId);
            }
            catch (error) {
                this.logger.warn(`Failed to delete Cloudinary asset ${publicId}: ${error.message}`);
            }
        }
    }
    async assertQuantityCanSupportExistingBookings(rentalProductId, nextQuantity) {
        const now = new Date();
        const rows = await this.prisma.bookingItem.findMany({
            where: {
                rentalProductId,
                booking: {
                    status: client_1.BookingStatus.CONFIRMED,
                    endTime: { gt: now },
                },
            },
            select: {
                booking: {
                    select: {
                        startTime: true,
                        endTime: true,
                    },
                },
            },
        });
        if (rows.length === 0)
            return;
        const events = [];
        for (const row of rows) {
            events.push({ at: row.booking.startTime.getTime(), delta: +1 });
            events.push({ at: row.booking.endTime.getTime(), delta: -1 });
        }
        events.sort((a, b) => (a.at - b.at) || (a.delta - b.delta));
        let active = 0;
        let peak = 0;
        for (const event of events) {
            active += event.delta;
            if (active > peak)
                peak = active;
        }
        if (nextQuantity < peak) {
            throw new common_1.BadRequestException(`Quantity cannot be set to ${nextQuantity}. ${peak} unit(s) are already reserved in overlapping confirmed bookings.`);
        }
    }
};
exports.RentalsService = RentalsService;
exports.RentalsService = RentalsService = RentalsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        upload_service_1.UploadService])
], RentalsService);
//# sourceMappingURL=rentals.service.js.map