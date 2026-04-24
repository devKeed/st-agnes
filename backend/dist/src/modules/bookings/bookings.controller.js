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
exports.BookingsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
const decorators_1 = require("../../common/decorators");
const bookings_service_1 = require("./bookings.service");
const dto_1 = require("./dto");
let BookingsController = class BookingsController {
    bookingsService;
    constructor(bookingsService) {
        this.bookingsService = bookingsService;
    }
    async create(dto) {
        const { booking, manageUrl } = await this.bookingsService.create(dto);
        return {
            id: booking.id,
            status: booking.status,
            manageToken: booking.manageToken,
            manageUrl,
            startTime: booking.startTime,
            endTime: booking.endTime,
            serviceType: booking.serviceType,
            message: 'Booking confirmed. Check your email for details.',
        };
    }
    getByToken(token) {
        return this.bookingsService.findByToken(token);
    }
    cancelByToken(token, body) {
        return this.bookingsService.cancelByToken(token, body?.reason);
    }
    rescheduleByToken(token, dto) {
        return this.bookingsService.rescheduleByToken(token, dto);
    }
    recoverBookings(dto) {
        return this.bookingsService.recoverBookings(dto);
    }
    listAll(query) {
        return this.bookingsService.findAll(query);
    }
    getOne(id) {
        return this.bookingsService.findOne(id);
    }
    updateStatus(id, dto) {
        return this.bookingsService.updateStatus(id, dto);
    }
};
exports.BookingsController = BookingsController;
__decorate([
    (0, decorators_1.Public)(),
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new booking (public)' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.CreateBookingDto]),
    __metadata("design:returntype", Promise)
], BookingsController.prototype, "create", null);
__decorate([
    (0, decorators_1.Public)(),
    (0, common_1.Get)('manage/:token'),
    (0, swagger_1.ApiOperation)({ summary: 'Get booking detail by manage token (client)' }),
    __param(0, (0, common_1.Param)('token')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], BookingsController.prototype, "getByToken", null);
__decorate([
    (0, decorators_1.Public)(),
    (0, common_1.Patch)('manage/:token/cancel'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({
        summary: 'Cancel a booking by manage token (client). Must be >24h before start.',
    }),
    __param(0, (0, common_1.Param)('token')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], BookingsController.prototype, "cancelByToken", null);
__decorate([
    (0, decorators_1.Public)(),
    (0, common_1.Patch)('manage/:token/reschedule'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({
        summary: 'Reschedule a booking by manage token (client). Must be >24h before current start.',
    }),
    __param(0, (0, common_1.Param)('token')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.RescheduleBookingDto]),
    __metadata("design:returntype", void 0)
], BookingsController.prototype, "rescheduleByToken", null);
__decorate([
    (0, decorators_1.Public)(),
    (0, common_1.Post)('recover'),
    (0, common_1.HttpCode)(common_1.HttpStatus.ACCEPTED),
    (0, swagger_1.ApiOperation)({
        summary: 'Request booking recovery email (public). Always returns 202 — never reveals whether bookings exist.',
    }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.RecoverBookingDto]),
    __metadata("design:returntype", void 0)
], BookingsController.prototype, "recoverBookings", null);
__decorate([
    (0, common_1.Get)(),
    (0, decorators_1.Roles)(client_1.AdminRole.SUPER_ADMIN, client_1.AdminRole.ADMIN),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({
        summary: 'List all bookings (admin). Supports filters: status, serviceType, dateFrom, dateTo, search.',
    }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.QueryBookingsDto]),
    __metadata("design:returntype", void 0)
], BookingsController.prototype, "listAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, decorators_1.Roles)(client_1.AdminRole.SUPER_ADMIN, client_1.AdminRole.ADMIN),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get booking detail by id (admin)' }),
    __param(0, (0, common_1.Param)('id', new common_1.ParseUUIDPipe())),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], BookingsController.prototype, "getOne", null);
__decorate([
    (0, common_1.Patch)(':id/status'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, decorators_1.Roles)(client_1.AdminRole.SUPER_ADMIN, client_1.AdminRole.ADMIN),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Update booking status (admin)' }),
    __param(0, (0, common_1.Param)('id', new common_1.ParseUUIDPipe())),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.UpdateBookingStatusDto]),
    __metadata("design:returntype", void 0)
], BookingsController.prototype, "updateStatus", null);
exports.BookingsController = BookingsController = __decorate([
    (0, swagger_1.ApiTags)('Bookings'),
    (0, common_1.Controller)('bookings'),
    __metadata("design:paramtypes", [bookings_service_1.BookingsService])
], BookingsController);
//# sourceMappingURL=bookings.controller.js.map