import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter | null = null;
  private readonly fromAddress: string;

  // SMTP is deliberately generic rather than tied to one vendor's SDK —
  // any provider that offers SMTP credentials works (Gmail with an App
  // Password, Resend, Brevo, Mailgun, SendGrid's SMTP relay, etc.), so
  // switching providers later is just changing env vars, not code.
  constructor() {
    const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, EMAIL_FROM } = process.env;
    this.fromAddress = EMAIL_FROM || SMTP_USER || 'no-reply@patient-tracking.local';

    if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
      const port = Number(SMTP_PORT) || 587;
      this.transporter = nodemailer.createTransport({
        host: SMTP_HOST,
        port,
        secure: port === 465, // 465 = implicit TLS; 587/25 use STARTTLS instead
        auth: { user: SMTP_USER, pass: SMTP_PASS },
      });
    } else {
      this.logger.warn(
        'SMTP_HOST/SMTP_USER/SMTP_PASS not set — password reset emails will be logged, not sent.',
      );
    }
  }

  async sendPasswordResetEmail(to: string, resetUrl: string) {
    const subject = 'Reset your Patient Tracking & Reporting password';
    const text =
      `Someone requested a password reset for this account. If this was you, ` +
      `click the link below (valid for 1 hour):\n\n${resetUrl}\n\n` +
      `If you didn't request this, you can safely ignore this email — your password won't change.`;

    if (!this.transporter) {
      // Dev/unconfigured fallback: log instead of failing outright, so the
      // rest of the flow (token creation, generic response) still works
      // and is testable without real SMTP credentials on hand.
      this.logger.warn(`SMTP not configured. Would have emailed ${to}:\n${resetUrl}`);
      return;
    }

    await this.transporter.sendMail({ from: this.fromAddress, to, subject, text });
  }
}
