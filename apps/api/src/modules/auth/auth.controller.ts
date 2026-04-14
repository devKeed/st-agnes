import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateAdminDto } from './dto/create-admin.dto';
import { LoginAdminDto } from './dto/login-admin.dto';

@Controller('api/v1/admin/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('bootstrap')
  bootstrapAdmin(@Body() dto: CreateAdminDto) {
    return this.authService.createInitialAdmin(dto);
  }

  @Post('login')
  login(@Body() dto: LoginAdminDto) {
    return this.authService.login(dto);
  }
}
