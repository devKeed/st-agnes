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
exports.UploadController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const swagger_1 = require("@nestjs/swagger");
const multer_1 = require("multer");
const client_1 = require("@prisma/client");
const decorators_1 = require("../../common/decorators");
const upload_service_1 = require("./upload.service");
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
const filePipe = new common_1.ParseFilePipeBuilder()
    .addFileTypeValidator({ fileType: /(jpeg|jpg|png|webp)$/i })
    .addMaxSizeValidator({ maxSize: MAX_FILE_SIZE_BYTES })
    .build({ errorHttpStatusCode: common_1.HttpStatus.BAD_REQUEST });
let UploadController = class UploadController {
    uploadService;
    constructor(uploadService) {
        this.uploadService = uploadService;
    }
    async upload(file, folder) {
        if (!file) {
            throw new common_1.BadRequestException('file is required');
        }
        return this.uploadService.uploadImage(file, folder);
    }
    async remove(publicId) {
        return this.uploadService.deleteImage(publicId);
    }
};
exports.UploadController = UploadController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Upload an image to Cloudinary (admin only)' }),
    (0, swagger_1.ApiConsumes)('multipart/form-data'),
    (0, swagger_1.ApiQuery)({
        name: 'folder',
        required: false,
        description: 'Target folder (one of: st-agnes/rentals, st-agnes/gallery, st-agnes/content, st-agnes/misc). Defaults to st-agnes/misc.',
    }),
    (0, swagger_1.ApiBody)({
        schema: {
            type: 'object',
            properties: {
                file: { type: 'string', format: 'binary' },
            },
        },
    }),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', {
        storage: (0, multer_1.memoryStorage)(),
        limits: { fileSize: MAX_FILE_SIZE_BYTES },
    })),
    __param(0, (0, common_1.UploadedFile)(filePipe)),
    __param(1, (0, common_1.Query)('folder')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], UploadController.prototype, "upload", null);
__decorate([
    (0, common_1.Delete)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({
        summary: 'Delete an image from Cloudinary by publicId (admin only). publicId passed via query string because it may contain slashes.',
    }),
    (0, swagger_1.ApiQuery)({ name: 'publicId', required: true }),
    __param(0, (0, common_1.Query)('publicId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UploadController.prototype, "remove", null);
exports.UploadController = UploadController = __decorate([
    (0, swagger_1.ApiTags)('Upload'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('upload'),
    (0, decorators_1.Roles)(client_1.AdminRole.SUPER_ADMIN, client_1.AdminRole.ADMIN),
    __metadata("design:paramtypes", [upload_service_1.UploadService])
], UploadController);
//# sourceMappingURL=upload.controller.js.map