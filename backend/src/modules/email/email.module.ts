import { Module } from '@nestjs/common';
import { EmailService } from './email.service';
import { RemindersService } from './reminders.service';
import { ResendProvider } from './resend.provider';

@Module({
  providers: [EmailService, RemindersService, ResendProvider],
  exports: [EmailService],
})
export class EmailModule {}
