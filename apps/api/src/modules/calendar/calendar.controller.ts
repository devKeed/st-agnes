import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PrismaService } from '../../common/prisma/prisma.service';

class ConnectCalendarDto {
  googleCalendarId!: string;
  refreshToken!: string;
}

@Controller('api/v1/admin/calendar')
@UseGuards(JwtAuthGuard)
export class CalendarController {
  constructor(private readonly prisma: PrismaService) {}

  @Post('connect')
  async connect(@Body() dto: ConnectCalendarDto) {
    const existing = await this.prisma.calendarConnection.findFirst();
    if (existing) {
      return this.prisma.calendarConnection.update({
        where: { id: existing.id },
        data: {
          googleCalendarId: dto.googleCalendarId,
          encryptedRefreshToken: dto.refreshToken,
        },
      });
    }

    return this.prisma.calendarConnection.create({
      data: {
        googleCalendarId: dto.googleCalendarId,
        encryptedRefreshToken: dto.refreshToken,
      },
    });
  }
}
