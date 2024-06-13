import { ResetPasswordContext } from './templates/reset-password-context';

export interface EmailRecipient {
  email: string;
  name: string;
}

export abstract class EmailService {
  abstract sendResetPassword(
    context: ResetPasswordContext,
    recipients: EmailRecipient[],
  ): Promise<void>;
}
