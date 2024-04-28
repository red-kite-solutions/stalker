import { Module } from '@nestjs/common';
import { JM_ENVIRONMENTS } from '../app.constants';
import { EmailTemplatesProvider } from './emails/email-templates.provider';
import { EmailService, MailJetEmailService } from './emails/email.service';
import { MockedEmailService as NullEmailService } from './emails/null-email.service';

@Module({
  imports: [],
  controllers: [],
  providers: [
    {
      provide: EmailService,
      useClass:
        process.env.JM_ENVIRONMENT !== JM_ENVIRONMENTS.tests
          ? MailJetEmailService
          : NullEmailService,
    },
    EmailTemplatesProvider,
  ],
  exports: [EmailService],
})
export class NotificationsModule {}
