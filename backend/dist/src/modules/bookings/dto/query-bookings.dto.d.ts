import { BookingStatus, ServiceType } from '@prisma/client';
import { PaginationDto } from '../../../common/dto';
export declare class QueryBookingsDto extends PaginationDto {
    status?: BookingStatus;
    serviceType?: ServiceType;
    dateFrom?: string;
    dateTo?: string;
    search?: string;
}
