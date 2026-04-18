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
exports.AvailabilityController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
const decorators_1 = require("../../common/decorators");
const availability_service_1 = require("./availability.service");
const dto_1 = require("./dto");
let AvailabilityController = class AvailabilityController {
    availabilityService;
    constructor(availabilityService) {
        this.availabilityService = availabilityService;
    }
    getAvailability(query) {
        return this.availabilityService.getMonthAvailability(query);
    }
    getBusinessHours() {
        return this.availabilityService.getBusinessHours();
    }
    block(dto, adminId) {
        return this.availabilityService.blockDate(dto, adminId);
    }
    unblock(id) {
        return this.availabilityService.unblockDate(id);
    }
    updateBusinessHours(dto) {
        return this.availabilityService.updateBusinessHours(dto);
    }
};
exports.AvailabilityController = AvailabilityController;
__decorate([
    (0, decorators_1.Public)(),
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Get available appointment slots for a month (public). Pass ?month=YYYY-MM&service=RENTAL.',
    }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.QueryAvailabilityDto]),
    __metadata("design:returntype", void 0)
], AvailabilityController.prototype, "getAvailability", null);
__decorate([
    (0, decorators_1.Public)(),
    (0, common_1.Get)('business-hours'),
    (0, swagger_1.ApiOperation)({ summary: 'Get studio business hours (public)' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AvailabilityController.prototype, "getBusinessHours", null);
__decorate([
    (0, common_1.Post)('block'),
    (0, decorators_1.Roles)(client_1.AdminRole.SUPER_ADMIN, client_1.AdminRole.ADMIN),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Block a date or time range (admin). Omit startTime/endTime for a full-day block.',
    }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, decorators_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.BlockDateDto, String]),
    __metadata("design:returntype", void 0)
], AvailabilityController.prototype, "block", null);
__decorate([
    (0, common_1.Delete)('block/:id'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, decorators_1.Roles)(client_1.AdminRole.SUPER_ADMIN, client_1.AdminRole.ADMIN),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Remove a blocked date/time (admin)' }),
    __param(0, (0, common_1.Param)('id', new common_1.ParseUUIDPipe())),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AvailabilityController.prototype, "unblock", null);
__decorate([
    (0, common_1.Put)('business-hours'),
    (0, decorators_1.Roles)(client_1.AdminRole.SUPER_ADMIN, client_1.AdminRole.ADMIN),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Upsert business hours (admin). Partial update supported — only rows in the payload are changed.',
    }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.UpdateBusinessHoursDto]),
    __metadata("design:returntype", void 0)
], AvailabilityController.prototype, "updateBusinessHours", null);
exports.AvailabilityController = AvailabilityController = __decorate([
    (0, swagger_1.ApiTags)('Availability'),
    (0, common_1.Controller)('availability'),
    __metadata("design:paramtypes", [availability_service_1.AvailabilityService])
], AvailabilityController);
//# sourceMappingURL=availability.controller.js.map