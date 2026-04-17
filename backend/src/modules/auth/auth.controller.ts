import {
  Controller,
  Post,
  Get,
  Body,
  Patch,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AdminRole } from '@prisma/client';
import { AuthService } from './auth.service';
import { LoginDto, CreateAdminDto } from './dto';
import { Public, CurrentUser, Roles } from '../../common/decorators';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Admin login' })
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Refresh access token' })
  async refresh(@CurrentUser('id') userId: string) {
    return this.authService.refreshToken(userId);
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current admin profile' })
  async getProfile(@CurrentUser('id') userId: string) {
    return this.authService.getProfile(userId);
  }

  @Post('admins')
  @Roles(AdminRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new admin user (Super Admin only)' })
  async createAdmin(
    @Body() dto: CreateAdminDto,
    @CurrentUser('role') role: AdminRole,
  ) {
    return this.authService.createAdmin(dto, role);
  }

  @Get('admins')
  @Roles(AdminRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all admin users (Super Admin only)' })
  async getAdmins() {
    return this.authService.getAdmins();
  }

  @Patch('admins/:id/toggle-status')
  @Roles(AdminRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Activate/deactivate an admin (Super Admin only)' })
  async toggleAdminStatus(
    @Param('id') adminId: string,
    @CurrentUser('id') currentUserId: string,
  ) {
    return this.authService.toggleAdminStatus(adminId, currentUserId);
  }
}
