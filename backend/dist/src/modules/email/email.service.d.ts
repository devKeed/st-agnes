import { PrismaService } from '../../prisma/prisma.service';
import type { ResendClient } from './resend.provider';
export declare class EmailService {
    private readonly prisma;
    private readonly resend;
    private readonly logger;
    constructor(prisma: PrismaService, resend: ResendClient);
    sendConfirmation(bookingId: string): void;
    sendReminder(bookingId: string): void;
    sendCancellation(bookingId: string): void;
    sendReschedule(bookingId: string): void;
    sendRecovery(recipientEmail: string, bookings: Array<{
        id: string;
        clientName: string;
        manageToken: string;
        serviceType: import('@prisma/client').ServiceType;
        startTime: Date;
    }>): void;
    sendReminderAwaitable(bookingId: string): Promise<boolean>;
    private deliverRecovery;
    private deliverForBooking;
    private buildContext;
}
