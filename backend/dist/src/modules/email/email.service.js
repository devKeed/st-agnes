"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var EmailService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../prisma/prisma.service");
const resend_provider_1 = require("./resend.provider");
const templates_1 = require("./templates");
let EmailService = EmailService_1 = class EmailService {
    prisma;
    resend;
    logger = new common_1.Logger(EmailService_1.name);
    constructor(prisma, resend) {
        this.prisma = prisma;
        this.resend = resend;
    }
    sendConfirmation(bookingId) {
        void this.deliverForBooking(bookingId, client_1.EmailType.CONFIRMATION, templates_1.renderConfirmation);
    }
    sendReminder(bookingId) {
        void this.deliverForBooking(bookingId, client_1.EmailType.REMINDER, templates_1.renderReminder);
    }
    sendCancellation(bookingId) {
        void this.deliverForBooking(bookingId, client_1.EmailType.CANCELLATION, templates_1.renderCancellation);
    }
    sendReschedule(bookingId) {
        void this.deliverForBooking(bookingId, client_1.EmailType.RESCHEDULE, templates_1.renderReschedule);
    }
    async sendReminderAwaitable(bookingId) {
        return this.deliverForBooking(bookingId, client_1.EmailType.REMINDER, templates_1.renderReminder);
    }
    async deliverForBooking(bookingId, type, render) {
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
                status: client_1.EmailStatus.PENDING,
            },
        });
        const from = process.env.EMAIL_FROM ?? 'St Agnes <bookings@stagnes.com>';
        try {
            const { error } = await this.resend.emails.send({
                from,
                to: [booking.clientEmail],
                subject: rendered.subject,
                html: rendered.html,
            });
            if (error) {
                throw new Error(typeof error === 'string' ? error : (error.message ?? JSON.stringify(error)));
            }
            await this.prisma.emailLog.update({
                where: { id: log.id },
                data: { status: client_1.EmailStatus.SENT, sentAt: new Date() },
            });
            this.logger.log(`Email sent (${type}) to ${booking.clientEmail} for booking ${booking.id}`);
            return true;
        }
        catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            await this.prisma.emailLog.update({
                where: { id: log.id },
                data: { status: client_1.EmailStatus.FAILED, errorMessage: message },
            });
            this.logger.warn(`Email failed (${type}) to ${booking.clientEmail} for booking ${booking.id}: ${message}`);
            return false;
        }
    }
    async buildContext(booking) {
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
};
exports.EmailService = EmailService;
exports.EmailService = EmailService = EmailService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, common_1.Inject)(resend_provider_1.RESEND)),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, Object])
], EmailService);
//# sourceMappingURL=email.service.js.map