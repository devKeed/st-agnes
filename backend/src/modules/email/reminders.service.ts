import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { BookingStatus, EmailStatus, EmailType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { EmailService } from './email.service';

const HOUR_MS = 60 * 60 * 1000;

@Injectable()
export class RemindersService {
  private readonly logger = new Logger(RemindersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
  ) {}

  /**
   * Runs hourly. Finds CONFIRMED bookings starting between now+23h and now+25h
   * that do not yet have a SENT REMINDER log, and sends the reminder.
   * The 2-hour window ensures no booking is missed if a run is skipped.
   */
  @Cron(CronExpression.EVERY_HOUR, { name: 'booking-reminders' })
  async sendDueReminders(): Promise<void> {
    const now = Date.now();
    const windowStart = new Date(now + 23 * HOUR_MS);
    const windowEnd = new Date(now + 25 * HOUR_MS);

    const candidates = await this.prisma.booking.findMany({
      where: {
        status: BookingStatus.CONFIRMED,
        startTime: { gte: windowStart, lte: windowEnd },
        emailLogs: {
          none: {
            type: EmailType.REMINDER,
            status: EmailStatus.SENT,
          },
        },
      },
      select: { id: true, clientEmail: true, startTime: true },
    });

    if (candidates.length === 0) {
      return;
    }

    this.logger.log(`Sending ${candidates.length} booking reminder(s)…`);

    for (const booking of candidates) {
      await this.emailService.sendReminderAwaitable(booking.id);
    }
  }
}
