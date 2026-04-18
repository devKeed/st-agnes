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
exports.TermsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
const decorators_1 = require("../../common/decorators");
const terms_service_1 = require("./terms.service");
const dto_1 = require("./dto");
let TermsController = class TermsController {
    termsService;
    constructor(termsService) {
        this.termsService = termsService;
    }
    getActive() {
        return this.termsService.getActive();
    }
    listAll() {
        return this.termsService.listAll();
    }
    create(dto, userId) {
        return this.termsService.create(dto, userId);
    }
    activate(id) {
        return this.termsService.activate(id);
    }
};
exports.TermsController = TermsController;
__decorate([
    (0, decorators_1.Public)(),
    (0, common_1.Get)('active'),
    (0, swagger_1.ApiOperation)({ summary: 'Get the currently active terms version (public)' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], TermsController.prototype, "getActive", null);
__decorate([
    (0, common_1.Get)(),
    (0, decorators_1.Roles)(client_1.AdminRole.SUPER_ADMIN, client_1.AdminRole.ADMIN),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'List all terms versions (admin)' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], TermsController.prototype, "listAll", null);
__decorate([
    (0, common_1.Post)(),
    (0, decorators_1.Roles)(client_1.AdminRole.SUPER_ADMIN, client_1.AdminRole.ADMIN),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Create a new terms version (admin). Pass activate=true to make it the live version immediately.',
    }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, decorators_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.CreateTermsDto, String]),
    __metadata("design:returntype", void 0)
], TermsController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(':id/activate'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, decorators_1.Roles)(client_1.AdminRole.SUPER_ADMIN, client_1.AdminRole.ADMIN),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Activate a specific terms version (admin). Deactivates any other active version.',
    }),
    __param(0, (0, common_1.Param)('id', new common_1.ParseUUIDPipe())),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], TermsController.prototype, "activate", null);
exports.TermsController = TermsController = __decorate([
    (0, swagger_1.ApiTags)('Terms'),
    (0, common_1.Controller)('terms'),
    __metadata("design:paramtypes", [terms_service_1.TermsService])
], TermsController);
//# sourceMappingURL=terms.controller.js.map