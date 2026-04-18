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
exports.UpdateBusinessHoursDto = exports.BusinessHoursRowDto = void 0;
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
class BusinessHoursRowDto {
    dayOfWeek;
    openTime;
    closeTime;
    isClosed;
}
exports.BusinessHoursRowDto = BusinessHoursRowDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: '0=Sunday … 6=Saturday' }),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(6),
    __metadata("design:type", Number)
], BusinessHoursRowDto.prototype, "dayOfWeek", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '09:00' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(/^([01]\d|2[0-3]):[0-5]\d$/, { message: 'openTime must be HH:mm' }),
    __metadata("design:type", String)
], BusinessHoursRowDto.prototype, "openTime", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '17:00' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(/^([01]\d|2[0-3]):[0-5]\d$/, { message: 'closeTime must be HH:mm' }),
    __metadata("design:type", String)
], BusinessHoursRowDto.prototype, "closeTime", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: false }),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], BusinessHoursRowDto.prototype, "isClosed", void 0);
class UpdateBusinessHoursDto {
    hours;
}
exports.UpdateBusinessHoursDto = UpdateBusinessHoursDto;
__decorate([
    (0, swagger_1.ApiProperty)({ type: [BusinessHoursRowDto] }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayMinSize)(1),
    (0, class_validator_1.ArrayMaxSize)(7),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => BusinessHoursRowDto),
    __metadata("design:type", Array)
], UpdateBusinessHoursDto.prototype, "hours", void 0);
//# sourceMappingURL=update-business-hours.dto.js.map