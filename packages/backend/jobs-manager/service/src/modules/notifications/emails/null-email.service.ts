import { EmailRecipient, EmailService } from './email.service';
import { ResetPasswordContext } from './templates/reset-password-context';

export class MockedEmailService implements EmailService {
  public sendResetPassword(
    context: ResetPasswordContext,
    recipients: EmailRecipient[],
  ): Promise<void> {
    return Promise.resolve();
  }
}
