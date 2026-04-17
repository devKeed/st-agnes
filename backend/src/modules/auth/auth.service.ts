import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { LoginDto, CreateAdminDto } from './dto';
import { AdminRole } from '@prisma/client';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async login(dto: LoginDto) {
    const user = await this.prisma.adminUser.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokens = await this.generateTokens(user.id, user.email, user.role);

    this.logger.log(`Admin logged in: ${user.email}`);

    return {
      access_token: tokens.accessToken,
      refresh_token: tokens.refreshToken,
      admin: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  }

  async refreshToken(userId: string) {
    const user = await this.prisma.adminUser.findUnique({
      where: { id: userId },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid user');
    }

    const tokens = await this.generateTokens(user.id, user.email, user.role);

    return {
      access_token: tokens.accessToken,
      refresh_token: tokens.refreshToken,
    };
  }

  async createAdmin(dto: CreateAdminDto, creatorRole: AdminRole) {
    // Only SUPER_ADMIN can create other admins
    if (creatorRole !== AdminRole.SUPER_ADMIN) {
      throw new UnauthorizedException('Only super admins can create admin users');
    }

    const existing = await this.prisma.adminUser.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const user = await this.prisma.adminUser.create({
      data: {
        email: dto.email.toLowerCase(),
        passwordHash,
        name: dto.name,
        role: dto.role || AdminRole.ADMIN,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });

    this.logger.log(`New admin created: ${user.email} (role: ${user.role})`);

    return user;
  }

  async getAdmins() {
    return this.prisma.adminUser.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async toggleAdminStatus(adminId: string, currentUserId: string) {
    if (adminId === currentUserId) {
      throw new ConflictException('Cannot deactivate your own account');
    }

    const admin = await this.prisma.adminUser.findUnique({
      where: { id: adminId },
    });

    if (!admin) {
      throw new UnauthorizedException('Admin not found');
    }

    return this.prisma.adminUser.update({
      where: { id: adminId },
      data: { isActive: !admin.isActive },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
      },
    });
  }

  async getProfile(userId: string) {
    return this.prisma.adminUser.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });
  }

  private async generateTokens(userId: string, email: string, role: AdminRole) {
    const payload = { sub: userId, email, role };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get('JWT_SECRET'),
        expiresIn: this.configService.get('JWT_EXPIRATION', '24h'),
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.get('JWT_REFRESH_EXPIRATION', '7d'),
      }),
    ]);

    return { accessToken, refreshToken };
  }
}
