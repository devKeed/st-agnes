import { AdminRole } from '@prisma/client';
import { AuthService } from './auth.service';
import { LoginDto, CreateAdminDto } from './dto';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    login(dto: LoginDto): Promise<{
        access_token: string;
        refresh_token: string;
        admin: {
            id: string;
            email: string;
            name: string;
            role: import("@prisma/client").$Enums.AdminRole;
        };
    }>;
    refresh(userId: string): Promise<{
        access_token: string;
        refresh_token: string;
    }>;
    getProfile(userId: string): Promise<{
        id: string;
        email: string;
        name: string;
        role: import("@prisma/client").$Enums.AdminRole;
        createdAt: Date;
    } | null>;
    createAdmin(dto: CreateAdminDto, role: AdminRole): Promise<{
        id: string;
        email: string;
        name: string;
        role: import("@prisma/client").$Enums.AdminRole;
        createdAt: Date;
    }>;
    getAdmins(): Promise<{
        id: string;
        email: string;
        name: string;
        role: import("@prisma/client").$Enums.AdminRole;
        isActive: boolean;
        createdAt: Date;
    }[]>;
    toggleAdminStatus(adminId: string, currentUserId: string): Promise<{
        id: string;
        email: string;
        name: string;
        role: import("@prisma/client").$Enums.AdminRole;
        isActive: boolean;
    }>;
}
