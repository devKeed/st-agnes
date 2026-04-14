import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateAdminDto } from './dto/create-admin.dto';
import { LoginAdminDto } from './dto/login-admin.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async createInitialAdmin(dto: CreateAdminDto) {
    const existing = await this.prisma.user.findFirst();
    if (existing) {
      throw new UnauthorizedException('Initial admin already exists');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const admin = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase(),
        passwordHash,
      },
    });

    return this.signToken(admin.id, admin.email);
  }

  async login(dto: LoginAdminDto) {
    const admin = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (!admin) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const valid = await bcrypt.compare(dto.password, admin.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.signToken(admin.id, admin.email);
  }

  private signToken(sub: string, email: string) {
    const expiresIn = this.configService.get<string>('JWT_EXPIRES_IN') ?? '1d';
    return {
      accessToken: this.jwtService.sign({ sub, email }, { expiresIn: expiresIn as never }),
    };
  }
}
