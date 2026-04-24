import { Inject, Injectable, Logger } from '@nestjs/common';
import { EmailStatus, EmailType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { RESEND } from './resend.provider';
import type { ResendClient } from './resend.provider';
import {
  RecoveryEmailContext,
  RenderedEmail,
  TemplateContext,
  renderCancellation,
  renderConfirmation,
  renderRecovery,
  renderReminder,
  renderReschedule,
} from './templates';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(RESEND) private readonly resend: ResendClient,
  ) {}

  // ─── Fire-and-forget public entrypoints ─────────────────────────────────────

  sendConfirmation(bookingId: string): void {
    void this.deliverForBooking(bookingId, EmailType.CONFIRMATION, renderConfirmation);
  }

  sendReminder(bookingId: string): void {
    void this.deliverForBooking(bookingId, EmailType.REMINDER, renderReminder);
  }

  sendCancellation(bookingId: string): void {
    void this.deliverForBooking(bookingId, EmailType.CANCELLATION, renderCancellation);
  }

  sendReschedule(bookingId: string): void {
    void this.deliverForBooking(bookingId, EmailType.RESCHEDULE, renderReschedule);
  }

  sendRecovery(
    recipientEmail: string,
    bookings: Array<{
      id: string;
      clientName: string;
      manageToken: string;
      serviceType: import('@prisma/client').ServiceType;
      startTime: Date;
    }>,
  ): void {
    void this.deliverRecovery(recipientEmail, bookings);
  }

  // ─── Awaitable variant used by the cron reminder job ────────────────────────

  async sendReminderAwaitable(bookingId: string): Promise<boolean> {
    return this.deliverForBooking(bookingId, EmailType.REMINDER, renderReminder);
  }

  // ─── Internal ───────────────────────────────────────────────────────────────

  private async deliverRecovery(
    recipientEmail: string,
    bookings: Array<{
      id: string;
      clientName: string;
      manageToken: string;
      serviceType: import('@prisma/client').ServiceType;
      startTime: Date;
    }>,
  ): Promise<void> {
    const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:3000';
    const from = process.env.EMAIL_FROM ?? 'St Agnes <bookings@stagnes.com>';

    const [emailContent, phoneContent] = await Promise.all([
      this.prisma.siteContent.findUnique({ where: { pageKey: 'contact_email' } }),
      this.prisma.siteContent.findUnique({ where: { pageKey: 'contact_phone' } }),
    ]);

    const ctx: RecoveryEmailContext = {
      clientName: bookings[0].clientName,
      bookings: bookings.map((b) => ({
        manageUrl: `${frontendUrl}/booking-manage/${b.manageToken}`,
        serviceType: b.serviceType,
        startTime: b.startTime,
      })),
      contactEmail: emailContent?.value,
      contactPhone: phoneContent?.value,
    };

    const rendered = renderRecovery(ctx);

    try {
      if (!this.resend) throw new Error('RESEND_API_KEY is not configured');

      const { error } = await this.resend.emails.send({
        from,
        to: [recipientEmail],
        subject: rendered.subject,
        html: rendered.html,
      });

      if (error) {
        throw new Error(
          typeof error === 'string' ? error : (error.message ?? JSON.stringify(error)),
        );
      }

      this.logger.log(`Recovery email sent to ${recipientEmail} (${bookings.length} booking(s))`);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.warn(`Recovery email failed to ${recipientEmail}: ${message}`);
    }
  }

  private async deliverForBooking(
    bookingId: string,
    type: EmailType,
    render: (ctx: TemplateContext) => RenderedEmail,
  ): Promise<boolean> {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
    });
    if (!booking) {
      this.logger.warn(`Email skipped: booking ${bookingId} not found (type=${type}).`);
      return false;
    }

    const ctx = await this.buildContext(booking);
    const rendered = render(ctx);

    const log = await this.prisma.emailLog.create({
      data: {
        bookingId: booking.id,
        recipient: booking.clientEmail,
        subject: rendered.subject,
        type,
        status: EmailStatus.PENDING,
      },
    });

    const from =
      process.env.EMAIL_FROM ?? 'St Agnes <bookings@stagnes.com>';

    try {
      if (!this.resend) {
        throw new Error('RESEND_API_KEY is not configured');
      }

      const { error } = await this.resend.emails.send({
        from,
        to: [booking.clientEmail],
        subject: rendered.subject,
        html: rendered.html,
      });

      if (error) {
        throw new Error(
          typeof error === 'string' ? error : (error.message ?? JSON.stringify(error)),
        );
      }

      await this.prisma.emailLog.update({
        where: { id: log.id },
        data: { status: EmailStatus.SENT, sentAt: new Date() },
      });

      this.logger.log(
        `Email sent (${type}) to ${booking.clientEmail} for booking ${booking.id}`,
      );
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await this.prisma.emailLog.update({
        where: { id: log.id },
        data: { status: EmailStatus.FAILED, errorMessage: message },
      });
      this.logger.warn(
        `Email failed (${type}) to ${booking.clientEmail} for booking ${booking.id}: ${message}`,
      );
      return false;
    }
  }

  private async buildContext(booking: TemplateContext['booking']): Promise<TemplateContext> {
    const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:3000';
    const manageUrl = `${frontendUrl}/booking-manage/${booking.manageToken}`;

    const [emailContent, phoneContent] = await Promise.all([
      this.prisma.siteContent.findUnique({ where: { pageKey: 'contact_email' } }),
      this.prisma.siteContent.findUnique({ where: { pageKey: 'contact_phone' } }),
    ]);

    return {
      booking,
      manageUrl,
      contactEmail: emailContent?.value,
      contactPhone: phoneContent?.value,
    };
  }
}
