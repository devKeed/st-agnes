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
var GalleryService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GalleryService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const upload_service_1 = require("../upload/upload.service");
let GalleryService = GalleryService_1 = class GalleryService {
    prisma;
    uploadService;
    logger = new common_1.Logger(GalleryService_1.name);
    constructor(prisma, uploadService) {
        this.prisma = prisma;
        this.uploadService = uploadService;
    }
    async create(dto) {
        return this.prisma.galleryItem.create({
            data: {
                category: dto.category,
                title: dto.title,
                description: dto.description,
                imageUrl: dto.imageUrl,
                imagePublicId: dto.imagePublicId,
                sortOrder: dto.sortOrder ?? 0,
                isVisible: dto.isVisible ?? true,
            },
        });
    }
    async findAll(query, options) {
        const includeHidden = options.isAdmin && query.includeHidden === 'true';
        const where = {
            ...(query.category ? { category: query.category } : {}),
            ...(includeHidden ? {} : { isVisible: true }),
        };
        return this.prisma.galleryItem.findMany({
            where,
            orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
        });
    }
    async findOne(id, options) {
        const item = await this.prisma.galleryItem.findUnique({ where: { id } });
        if (!item) {
            throw new common_1.NotFoundException(`Gallery item ${id} not found`);
        }
        if (!options.isAdmin && !item.isVisible) {
            throw new common_1.NotFoundException(`Gallery item ${id} not found`);
        }
        return item;
    }
    async update(id, dto) {
        const existing = await this.prisma.galleryItem.findUnique({ where: { id } });
        if (!existing) {
            throw new common_1.NotFoundException(`Gallery item ${id} not found`);
        }
        if (dto.imagePublicId !== undefined &&
            existing.imagePublicId &&
            existing.imagePublicId !== dto.imagePublicId) {
            await this.bestEffortDeleteFromCdn(existing.imagePublicId);
        }
        const data = {
            ...(dto.category !== undefined ? { category: dto.category } : {}),
            ...(dto.title !== undefined ? { title: dto.title } : {}),
            ...(dto.description !== undefined ? { description: dto.description } : {}),
            ...(dto.imageUrl !== undefined ? { imageUrl: dto.imageUrl } : {}),
            ...(dto.imagePublicId !== undefined
                ? { imagePublicId: dto.imagePublicId }
                : {}),
            ...(dto.sortOrder !== undefined ? { sortOrder: dto.sortOrder } : {}),
            ...(dto.isVisible !== undefined ? { isVisible: dto.isVisible } : {}),
        };
        return this.prisma.galleryItem.update({ where: { id }, data });
    }
    async remove(id) {
        const existing = await this.prisma.galleryItem.findUnique({ where: { id } });
        if (!existing) {
            throw new common_1.NotFoundException(`Gallery item ${id} not found`);
        }
        await this.prisma.galleryItem.delete({ where: { id } });
        if (existing.imagePublicId) {
            await this.bestEffortDeleteFromCdn(existing.imagePublicId);
        }
        return { id };
    }
    async reorder(dto) {
        const ids = dto.items.map((i) => i.id);
        const unique = new Set(ids);
        if (unique.size !== ids.length) {
            throw new common_1.BadRequestException('Duplicate ids in reorder payload');
        }
        const found = await this.prisma.galleryItem.findMany({
            where: { id: { in: ids } },
            select: { id: true },
        });
        if (found.length !== ids.length) {
            const foundSet = new Set(found.map((f) => f.id));
            const missing = ids.filter((id) => !foundSet.has(id));
            throw new common_1.NotFoundException(`Unknown gallery item id(s): ${missing.join(', ')}`);
        }
        await this.prisma.$transaction(dto.items.map((item) => this.prisma.galleryItem.update({
            where: { id: item.id },
            data: { sortOrder: item.sortOrder },
        })));
        return { updated: dto.items.length };
    }
    async bestEffortDeleteFromCdn(publicId) {
        try {
            await this.uploadService.deleteImage(publicId);
        }
        catch (error) {
            this.logger.warn(`Failed to delete Cloudinary asset ${publicId}: ${error.message}`);
        }
    }
};
exports.GalleryService = GalleryService;
exports.GalleryService = GalleryService = GalleryService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        upload_service_1.UploadService])
], GalleryService);
//# sourceMappingURL=gallery.service.js.map