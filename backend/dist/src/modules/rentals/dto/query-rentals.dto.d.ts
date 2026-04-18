import { RentalStatus } from '@prisma/client';
import { PaginationDto } from '../../../common/dto';
export declare class QueryRentalsDto extends PaginationDto {
    status?: RentalStatus;
    includeHidden?: string;
    search?: string;
}
