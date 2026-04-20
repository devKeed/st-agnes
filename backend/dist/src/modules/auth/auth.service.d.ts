import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { LoginDto, CreateAdminDto } from './dto';
import { AdminRole } from '@prisma/client';
export declare class AuthService {
    private prisma;
    private jwtService;
    private configService;
    private readonly logger;
    constructor(prisma: PrismaService, jwtService: JwtService, configService: ConfigService);
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
    refreshToken(userId: string): Promise<{
        access_token: string;
        refresh_token: string;
    }>;
    createAdmin(dto: CreateAdminDto, creatorRole: AdminRole): Promise<{
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
    getProfile(userId: string): Promise<{
        id: string;
        email: string;
        name: string;
        role: import("@prisma/client").$Enums.AdminRole;
        createdAt: Date;
    } | null>;
    private generateTokens;
}
