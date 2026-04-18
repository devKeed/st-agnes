"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CloudinaryProvider = exports.CLOUDINARY = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const cloudinary_1 = require("cloudinary");
exports.CLOUDINARY = Symbol('CLOUDINARY');
exports.CloudinaryProvider = {
    provide: exports.CLOUDINARY,
    inject: [config_1.ConfigService],
    useFactory: (config) => {
        const logger = new common_1.Logger('CloudinaryProvider');
        const cloudName = config.get('CLOUDINARY_CLOUD_NAME');
        const apiKey = config.get('CLOUDINARY_API_KEY');
        const apiSecret = config.get('CLOUDINARY_API_SECRET');
        if (!cloudName || !apiKey || !apiSecret) {
            logger.warn('Cloudinary env vars missing (CLOUDINARY_CLOUD_NAME / _API_KEY / _API_SECRET). Upload endpoints will fail until configured.');
        }
        cloudinary_1.v2.config({
            cloud_name: cloudName,
            api_key: apiKey,
            api_secret: apiSecret,
            secure: true,
        });
        return cloudinary_1.v2;
    },
};
//# sourceMappingURL=cloudinary.provider.js.map