import {
  BadRequestException,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { AdminRole } from '@prisma/client';
import { Public, Roles } from '../../common/decorators';
import { CalendarService } from './calendar.service';

@ApiTags('Google Calendar')
@Controller('calendar')
export class CalendarController {
  constructor(private readonly calendarService: CalendarService) {}

  @Get('auth-url')
  @Roles(AdminRole.SUPER_ADMIN, AdminRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get Google OAuth consent URL (admin)' })
  @ApiQuery({
    name: 'calendarId',
    required: false,
    description: 'Calendar ID to sync to. Defaults to "primary".',
  })
  getAuthUrl(@Query('calendarId') calendarId?: string) {
    return this.calendarService.getAuthUrl(calendarId);
  }

  @Public()
  @Get('callback')
  @ApiOperation({ summary: 'Google OAuth callback handler' })
  async callback(
    @Query('code') code?: string,
    @Query('state') state?: string,
    @Query('error') error?: string,
  ) {
    if (error) {
      throw new BadRequestException(`Google OAuth error: ${error}`);
    }
    if (!code) {
      throw new BadRequestException('Missing OAuth code from Google callback.');
    }

    const result = await this.calendarService.handleOAuthCallback(code, state);
    return {
      success: true,
      message: 'Google Calendar connected successfully.',
      ...result,
    };
  }

  @Get('status')
  @Roles(AdminRole.SUPER_ADMIN, AdminRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get Google Calendar connection status (admin)' })
  getStatus() {
    return this.calendarService.getStatus();
  }

  @Post('disconnect')
  @HttpCode(HttpStatus.OK)
  @Roles(AdminRole.SUPER_ADMIN, AdminRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Disconnect Google Calendar (admin)' })
  disconnect() {
    return this.calendarService.disconnect();
  }
}
