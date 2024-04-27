import { Injectable, Logger } from '@nestjs/common';
import { Client } from 'node-mailjet';
import {
  EMAIL_RECIPIENTS_FILTER_LIST,
  EMAIL_RECIPIENTS_FILTER_LIST_MODE,
  MAILJET_API_KEY,
  MAILJET_API_SECRET,
} from '../notifications-constants';
import { EmailTemplatesProvider } from './email-templates.provider';
import { ResetPasswordContext } from './templates/reset-password-context';

export interface EmailRecipient {
  email: string;
  name: string;
}

@Injectable()
export class EmailService {
  private logger = new Logger(EmailService.name);
  private filterMode = EMAIL_RECIPIENTS_FILTER_LIST_MODE;
  private filterList = new Set(EMAIL_RECIPIENTS_FILTER_LIST);
  private client = new Client({
    apiKey: MAILJET_API_KEY,
    apiSecret: MAILJET_API_SECRET,
  });

  constructor(private templatesProvider: EmailTemplatesProvider) {}

  public async sendResetPassword(
    context: ResetPasswordContext,
    recipients: EmailRecipient[],
  ) {
    const email = this.templatesProvider.getResetPasswordTemplate(context);
    await this.sendEmail(email.subject, email.body, recipients);
  }

  private async sendEmail(
    subject: string,
    body: string,
    recipients: EmailRecipient[],
  ) {
    const filteredRecipients = this.filterRecipients(recipients);
    try {
      await this.client.post('send', { version: 'v3.1' }).request({
        Messages: [
          {
            From: {
              Email: 'aboisiermichaud@gmail.com',
            },
            To: filteredRecipients.map((x) => ({
              Email: x.email,
              Name: x.name,
            })),
            Subject: subject,
            HTMLPart: body,
          },
        ],
      });
    } catch (e) {
      this.logger.error(e);
    }
  }

  private filterRecipients(recipients: EmailRecipient[]) {
    if (recipients == null) return [];

    switch (this.filterMode) {
      case 'block-list':
        return recipients.filter((x) => !this.filterList.has(x.email));

      case 'allow-list':
        return recipients.filter((x) => this.filterList.has(x.email));

      default:
        this.logger.error(
          `Unknown email recipient filter list mode ${this.filterMode}`,
        );
    }
  }
}
