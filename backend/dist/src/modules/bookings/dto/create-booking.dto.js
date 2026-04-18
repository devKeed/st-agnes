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
exports.CreateBookingDto = exports.RentalItemDto = void 0;
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
class RentalItemDto {
    rentalProductId;
    selectedSize;
}
exports.RentalItemDto = RentalItemDto;
__decorate([
    (0, swagger_1.ApiProperty)({ format: 'uuid' }),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], RentalItemDto.prototype, "rentalProductId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'M' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RentalItemDto.prototype, "selectedSize", void 0);
class CreateBookingDto {
    clientName;
    clientEmail;
    clientPhone;
    serviceType;
    startTime;
    notes;
    specialRequests;
    rentalItems;
    termsAccepted;
    termsVersionId;
}
exports.CreateBookingDto = CreateBookingDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Jane Doe' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MinLength)(2),
    __metadata("design:type", String)
], CreateBookingDto.prototype, "clientName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'jane@example.com' }),
    (0, class_validator_1.IsEmail)(),
    __metadata("design:type", String)
], CreateBookingDto.prototype, "clientEmail", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '+234 801 234 5678' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateBookingDto.prototype, "clientPhone", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: client_1.ServiceType }),
    (0, class_validator_1.IsEnum)(client_1.ServiceType),
    __metadata("design:type", String)
], CreateBookingDto.prototype, "serviceType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2026-05-10T08:00:00.000Z', description: 'UTC ISO start time.' }),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateBookingDto.prototype, "startTime", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Optional notes (reason for visit, preferences, etc.)',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateBookingDto.prototype, "notes", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Special requests for the studio.' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateBookingDto.prototype, "specialRequests", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        type: [RentalItemDto],
        description: 'Required when serviceType = RENTAL.',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayMaxSize)(20),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => RentalItemDto),
    __metadata("design:type", Array)
], CreateBookingDto.prototype, "rentalItems", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: true }),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateBookingDto.prototype, "termsAccepted", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        format: 'uuid',
        description: 'Must match the currently active TermsVersion id.',
    }),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateBookingDto.prototype, "termsVersionId", void 0);
//# sourceMappingURL=create-booking.dto.js.map