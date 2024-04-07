import { Injectable } from '@nestjs/common';
import { readFileSync } from 'fs';
import { compile } from 'handlebars';
import mjml2html from 'mjml';
import { resolve } from 'path';
import { EMAIL_TEMPLATES_PATH } from '../notifications-constants';
import { ResetPasswordContext } from './templates/reset-password-context';

export interface Email {
  subject: string;
  body: string;
}

@Injectable()
export class EmailTemplatesProvider {
  private templatesCache: Record<string, string> = {};

  public getResetPasswordTemplate(context: ResetPasswordContext): Email {
    const subject = 'Password reset';
    const body = this.getHtml('reset-password.template.mjml', context);
    return { subject, body };
  }

  private getHtml(fileName: string, context: unknown) {
    const template = this.getMjml(fileName);
    const interpolatedTemplate = this.replaceValues(template, context);
    console.log(mjml2html);
    return mjml2html(interpolatedTemplate).html;
  }

  private replaceValues(template: string, context: unknown) {
    return compile(template)(context);
  }

  private getMjml(fileName: string) {
    if (!(fileName in this.templatesCache)) {
      const filePath = resolve(EMAIL_TEMPLATES_PATH, fileName);
      this.templatesCache[fileName] = readFileSync(filePath).toString();
    }

    return this.templatesCache[fileName];
  }
}
