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
var RemindersService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RemindersService = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../prisma/prisma.service");
const email_service_1 = require("./email.service");
const HOUR_MS = 60 * 60 * 1000;
let RemindersService = RemindersService_1 = class RemindersService {
    prisma;
    emailService;
    logger = new common_1.Logger(RemindersService_1.name);
    constructor(prisma, emailService) {
        this.prisma = prisma;
        this.emailService = emailService;
    }
    async sendDueReminders() {
        const now = Date.now();
        const windowStart = new Date(now + 23 * HOUR_MS);
        const windowEnd = new Date(now + 25 * HOUR_MS);
        const candidates = await this.prisma.booking.findMany({
            where: {
                status: client_1.BookingStatus.CONFIRMED,
                startTime: { gte: windowStart, lte: windowEnd },
                emailLogs: {
                    none: {
                        type: client_1.EmailType.REMINDER,
                        status: client_1.EmailStatus.SENT,
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
};
exports.RemindersService = RemindersService;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_HOUR, { name: 'booking-reminders' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], RemindersService.prototype, "sendDueReminders", null);
exports.RemindersService = RemindersService = RemindersService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        email_service_1.EmailService])
], RemindersService);
//# sourceMappingURL=reminders.service.js.map