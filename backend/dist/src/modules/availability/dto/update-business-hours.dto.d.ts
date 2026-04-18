export declare class BusinessHoursRowDto {
    dayOfWeek: number;
    openTime: string;
    closeTime: string;
    isClosed: boolean;
}
export declare class UpdateBusinessHoursDto {
    hours: BusinessHoursRowDto[];
}
