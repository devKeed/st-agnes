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
Object.defineProperty(exports, "__esModule", { value: true });
exports.TermsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let TermsService = class TermsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getActive() {
        const active = await this.prisma.termsVersion.findFirst({
            where: { isActive: true },
            orderBy: { publishedAt: 'desc' },
        });
        if (!active) {
            throw new common_1.NotFoundException('No active terms version');
        }
        return active;
    }
    listAll() {
        return this.prisma.termsVersion.findMany({
            orderBy: { createdAt: 'desc' },
        });
    }
    async create(dto, createdById) {
        const existing = await this.prisma.termsVersion.findFirst({
            where: { versionLabel: dto.versionLabel },
        });
        if (existing) {
            throw new common_1.ConflictException(`Terms version '${dto.versionLabel}' already exists`);
        }
        if (dto.activate) {
            return this.prisma.$transaction(async (tx) => {
                await tx.termsVersion.updateMany({
                    where: { isActive: true },
                    data: { isActive: false },
                });
                return tx.termsVersion.create({
                    data: {
                        versionLabel: dto.versionLabel,
                        content: dto.content,
                        isActive: true,
                        publishedAt: new Date(),
                        createdById,
                    },
                });
            });
        }
        return this.prisma.termsVersion.create({
            data: {
                versionLabel: dto.versionLabel,
                content: dto.content,
                isActive: false,
                createdById,
            },
        });
    }
    async activate(id) {
        const target = await this.prisma.termsVersion.findUnique({ where: { id } });
        if (!target) {
            throw new common_1.NotFoundException(`Terms version ${id} not found`);
        }
        return this.prisma.$transaction(async (tx) => {
            await tx.termsVersion.updateMany({
                where: { isActive: true, NOT: { id } },
                data: { isActive: false },
            });
            return tx.termsVersion.update({
                where: { id },
                data: {
                    isActive: true,
                    publishedAt: target.publishedAt ?? new Date(),
                },
            });
        });
    }
};
exports.TermsService = TermsService;
exports.TermsService = TermsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], TermsService);
//# sourceMappingURL=terms.service.js.map