import { Body, Controller, Get, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminRole } from '@prisma/client';
import { CurrentUser, Public, Roles } from '../../common/decorators';
import { CalendarService } from './calendar.service';
import { UpdateCalendarIdDto } from './dto/update-calendar-id.dto';

@ApiTags('Google Calendar')
@Controller('calendar')
export class CalendarController {
  constructor(private readonly calendarService: CalendarService) {}

  @Get('auth-url')
  @Roles(AdminRole.SUPER_ADMIN, AdminRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get Google OAuth consent URL (admin)' })
  getAuthUrl(@CurrentUser('id') adminId: string) {
    return this.calendarService.getAuthUrl(adminId);
  }

  @Public()
  @Get('callback')
  @ApiOperation({ summary: 'Google OAuth callback handler (public)' })
  async handleCallback(
    @Query('code') code?: string,
    @Query('state') state?: string,
    @Query('error') error?: string,
  ) {
    return this.calendarService.handleOAuthCallback({ code, state, error });
  }

  @Get('status')
  @Roles(AdminRole.SUPER_ADMIN, AdminRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Check Google Calendar connection status (admin)' })
  getStatus() {
    return this.calendarService.getStatus();
  }

  @Patch('calendar-id')
  @Roles(AdminRole.SUPER_ADMIN, AdminRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'Update the connected Google Calendar ID without reconnecting OAuth (admin)',
  })
  updateCalendarId(@Body() dto: UpdateCalendarIdDto) {
    return this.calendarService.updateCalendarId(dto.calendarId);
  }

  @Post('disconnect')
  @Roles(AdminRole.SUPER_ADMIN, AdminRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Disconnect Google Calendar integration (admin)' })
  disconnect() {
    return this.calendarService.disconnect();
  }
}
