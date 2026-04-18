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
var UploadService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.UploadService = void 0;
const common_1 = require("@nestjs/common");
const cloudinary_provider_1 = require("./cloudinary.provider");
const ALLOWED_FOLDERS = new Set([
    'st-agnes/rentals',
    'st-agnes/gallery',
    'st-agnes/content',
    'st-agnes/misc',
]);
const DEFAULT_FOLDER = 'st-agnes/misc';
let UploadService = UploadService_1 = class UploadService {
    cloudinary;
    logger = new common_1.Logger(UploadService_1.name);
    constructor(cloudinary) {
        this.cloudinary = cloudinary;
    }
    async uploadImage(file, folder) {
        const targetFolder = this.resolveFolder(folder);
        try {
            const result = await new Promise((resolve, reject) => {
                const stream = this.cloudinary.uploader.upload_stream({
                    folder: targetFolder,
                    resource_type: 'image',
                    use_filename: false,
                    unique_filename: true,
                    overwrite: false,
                }, (error, response) => {
                    if (error || !response) {
                        return reject(error ?? new Error('Cloudinary returned no response'));
                    }
                    resolve(response);
                });
                stream.end(file.buffer);
            });
            return {
                url: result.secure_url,
                publicId: result.public_id,
                format: result.format,
                width: result.width,
                height: result.height,
                bytes: result.bytes,
            };
        }
        catch (error) {
            this.logger.error(`Cloudinary upload failed (folder=${targetFolder}): ${error.message}`, error.stack);
            throw new common_1.InternalServerErrorException('Image upload failed');
        }
    }
    async deleteImage(publicId) {
        if (!publicId || publicId.trim() === '') {
            throw new common_1.BadRequestException('publicId is required');
        }
        try {
            const result = await this.cloudinary.uploader.destroy(publicId, {
                resource_type: 'image',
                invalidate: true,
            });
            if (result.result !== 'ok' && result.result !== 'not found') {
                this.logger.warn(`Cloudinary destroy returned: ${result.result}`);
            }
            return { result: result.result, publicId };
        }
        catch (error) {
            this.logger.error(`Cloudinary delete failed (publicId=${publicId}): ${error.message}`, error.stack);
            throw new common_1.InternalServerErrorException('Image delete failed');
        }
    }
    resolveFolder(folder) {
        if (!folder)
            return DEFAULT_FOLDER;
        if (ALLOWED_FOLDERS.has(folder))
            return folder;
        throw new common_1.BadRequestException(`Invalid folder. Allowed: ${Array.from(ALLOWED_FOLDERS).join(', ')}`);
    }
};
exports.UploadService = UploadService;
exports.UploadService = UploadService = UploadService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(cloudinary_provider_1.CLOUDINARY)),
    __metadata("design:paramtypes", [Object])
], UploadService);
//# sourceMappingURL=upload.service.js.map