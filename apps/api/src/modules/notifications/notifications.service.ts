import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Booking } from '@prisma/client';
import { Resend } from 'resend';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private readonly resend?: Resend;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    const apiKey = this.configService.get<string>('RESEND_API_KEY');
    if (apiKey) {
      this.resend = new Resend(apiKey);
    }
  }

  async sendBookingConfirmation(booking: Booking, managementToken: string) {
    const from = this.configService.get<string>('RESEND_FROM_EMAIL') ?? 'noreply@st-agnes.com';
    const manageUrl = `${this.configService.get<string>('WEB_BASE_URL')}/booking/manage?token=${managementToken}&reference=${booking.referenceCode}`;

    if (!this.resend) {
      this.logger.warn('RESEND_API_KEY not configured. Skipping email send.');
      return;
    }

    const response = await this.resend.emails.send({
      from,
      to: booking.clientEmail,
      subject: `Booking Confirmed: ${booking.referenceCode}`,
      html: `<p>Hello ${booking.clientName}, your appointment is confirmed.</p><p>Manage booking: <a href="${manageUrl}">${manageUrl}</a></p>`,
    });

    const providerId = (response.data as { id?: string } | null | undefined)?.id ?? null;

    await this.prisma.emailLog.create({
      data: {
        bookingId: booking.id,
        template: 'booking-confirmation',
        recipient: booking.clientEmail,
        providerId,
        status: response.error ? 'FAILED' : 'SENT',
      },
    });
  }
}
