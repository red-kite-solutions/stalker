import { Module } from '@nestjs/common';
import { EmailTemplatesProvider } from './emails/email-templates.provider';
import { EmailService } from './emails/email.service';

@Module({
  imports: [],
  controllers: [],
  providers: [EmailService, EmailTemplatesProvider],
  exports: [EmailService],
})
export class NotificationsModule {}
