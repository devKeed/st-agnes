"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateRentalDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const create_rental_dto_1 = require("./create-rental.dto");
class UpdateRentalDto extends (0, swagger_1.PartialType)(create_rental_dto_1.CreateRentalDto) {
}
exports.UpdateRentalDto = UpdateRentalDto;
//# sourceMappingURL=update-rental.dto.js.map