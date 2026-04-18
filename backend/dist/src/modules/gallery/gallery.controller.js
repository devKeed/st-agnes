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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GalleryController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
const decorators_1 = require("../../common/decorators");
const gallery_service_1 = require("./gallery.service");
const dto_1 = require("./dto");
let GalleryController = class GalleryController {
    galleryService;
    constructor(galleryService) {
        this.galleryService = galleryService;
    }
    listPublic(query) {
        return this.galleryService.findAll(query, { isAdmin: false });
    }
    listAdmin(query) {
        return this.galleryService.findAll(query, { isAdmin: true });
    }
    create(dto) {
        return this.galleryService.create(dto);
    }
    reorder(dto) {
        return this.galleryService.reorder(dto);
    }
    getPublic(id) {
        return this.galleryService.findOne(id, { isAdmin: false });
    }
    update(id, dto) {
        return this.galleryService.update(id, dto);
    }
    remove(id) {
        return this.galleryService.remove(id);
    }
};
exports.GalleryController = GalleryController;
__decorate([
    (0, decorators_1.Public)(),
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({
        summary: 'List visible gallery items, optionally filtered by category (public)',
    }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.QueryGalleryDto]),
    __metadata("design:returntype", void 0)
], GalleryController.prototype, "listPublic", null);
__decorate([
    (0, common_1.Get)('admin/list'),
    (0, decorators_1.Roles)(client_1.AdminRole.SUPER_ADMIN, client_1.AdminRole.ADMIN),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Admin list — supports includeHidden=true to surface hidden items.',
    }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.QueryGalleryDto]),
    __metadata("design:returntype", void 0)
], GalleryController.prototype, "listAdmin", null);
__decorate([
    (0, common_1.Post)(),
    (0, decorators_1.Roles)(client_1.AdminRole.SUPER_ADMIN, client_1.AdminRole.ADMIN),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create gallery item (admin)' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.CreateGalleryDto]),
    __metadata("design:returntype", void 0)
], GalleryController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)('reorder'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, decorators_1.Roles)(client_1.AdminRole.SUPER_ADMIN, client_1.AdminRole.ADMIN),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Bulk-update sort order (admin). All ids must exist; duplicates rejected.',
    }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.ReorderGalleryDto]),
    __metadata("design:returntype", void 0)
], GalleryController.prototype, "reorder", null);
__decorate([
    (0, decorators_1.Public)(),
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get a single gallery item by id (public)' }),
    __param(0, (0, common_1.Param)('id', new common_1.ParseUUIDPipe())),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], GalleryController.prototype, "getPublic", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, decorators_1.Roles)(client_1.AdminRole.SUPER_ADMIN, client_1.AdminRole.ADMIN),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Update gallery item (admin)' }),
    __param(0, (0, common_1.Param)('id', new common_1.ParseUUIDPipe())),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.UpdateGalleryDto]),
    __metadata("design:returntype", void 0)
], GalleryController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, decorators_1.Roles)(client_1.AdminRole.SUPER_ADMIN, client_1.AdminRole.ADMIN),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Delete gallery item (admin) — also removes the Cloudinary asset best-effort.',
    }),
    __param(0, (0, common_1.Param)('id', new common_1.ParseUUIDPipe())),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], GalleryController.prototype, "remove", null);
exports.GalleryController = GalleryController = __decorate([
    (0, swagger_1.ApiTags)('Gallery'),
    (0, common_1.Controller)('gallery'),
    __metadata("design:paramtypes", [gallery_service_1.GalleryService])
], GalleryController);
//# sourceMappingURL=gallery.controller.js.map