"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResendProvider = exports.RESEND = void 0;
const common_1 = require("@nestjs/common");
const resend_1 = require("resend");
exports.RESEND = Symbol('RESEND');
exports.ResendProvider = {
    provide: exports.RESEND,
    useFactory: () => {
        const logger = new common_1.Logger('ResendProvider');
        const apiKey = process.env.RESEND_API_KEY;
        if (!apiKey) {
            logger.warn('RESEND_API_KEY is not set. Outbound email will be logged as FAILED until configured.');
            return null;
        }
        return new resend_1.Resend(apiKey);
    },
};
//# sourceMappingURL=resend.provider.js.map