import { AdminRole } from '@prisma/client';
export declare class CreateAdminDto {
    email: string;
    password: string;
    name: string;
    role?: AdminRole;
}
