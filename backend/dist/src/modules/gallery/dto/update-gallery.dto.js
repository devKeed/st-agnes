"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateGalleryDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const create_gallery_dto_1 = require("./create-gallery.dto");
class UpdateGalleryDto extends (0, swagger_1.PartialType)(create_gallery_dto_1.CreateGalleryDto) {
}
exports.UpdateGalleryDto = UpdateGalleryDto;
//# sourceMappingURL=update-gallery.dto.js.map