import { AvailabilityService } from './availability.service';
import { BlockDateDto, QueryAvailabilityDto, UpdateBusinessHoursDto } from './dto';
export declare class AvailabilityController {
    private readonly availabilityService;
    constructor(availabilityService: AvailabilityService);
    getAvailability(query: QueryAvailabilityDto): Promise<import("./availability.service").AvailabilityResponse>;
    getBusinessHours(): Promise<{
        id: string;
        dayOfWeek: number;
        openTime: string;
        closeTime: string;
        isClosed: boolean;
    }[]>;
    block(dto: BlockDateDto, adminId: string): Promise<{
        id: string;
        createdAt: Date;
        date: Date;
        startTime: string | null;
        endTime: string | null;
        googleEventId: string | null;
        reason: string | null;
        blockedById: string | null;
    }>;
    unblock(id: string): Promise<{
        id: string;
    }>;
    updateBusinessHours(dto: UpdateBusinessHoursDto): Promise<{
        id: string;
        dayOfWeek: number;
        openTime: string;
        closeTime: string;
        isClosed: boolean;
    }[]>;
}
