import { PrismaService } from '../../prisma/prisma.service';
import { EmailService } from './email.service';
export declare class RemindersService {
    private readonly prisma;
    private readonly emailService;
    private readonly logger;
    constructor(prisma: PrismaService, emailService: EmailService);
    sendDueReminders(): Promise<void>;
}
