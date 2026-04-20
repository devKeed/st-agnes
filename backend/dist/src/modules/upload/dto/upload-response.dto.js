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
exports.DeleteResponseDto = exports.UploadResponseDto = void 0;
const swagger_1 = require("@nestjs/swagger");
class UploadResponseDto {
    url;
    publicId;
    format;
    width;
    height;
    bytes;
}
exports.UploadResponseDto = UploadResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'https://res.cloudinary.com/.../image/upload/.../abc.jpg' }),
    __metadata("design:type", String)
], UploadResponseDto.prototype, "url", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'st-agnes/rentals/abc' }),
    __metadata("design:type", String)
], UploadResponseDto.prototype, "publicId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'jpg' }),
    __metadata("design:type", String)
], UploadResponseDto.prototype, "format", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1920 }),
    __metadata("design:type", Number)
], UploadResponseDto.prototype, "width", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1080 }),
    __metadata("design:type", Number)
], UploadResponseDto.prototype, "height", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 284512 }),
    __metadata("design:type", Number)
], UploadResponseDto.prototype, "bytes", void 0);
class DeleteResponseDto {
    result;
    publicId;
}
exports.DeleteResponseDto = DeleteResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'ok' }),
    __metadata("design:type", String)
], DeleteResponseDto.prototype, "result", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'st-agnes/rentals/abc' }),
    __metadata("design:type", String)
], DeleteResponseDto.prototype, "publicId", void 0);
//# sourceMappingURL=upload-response.dto.js.map