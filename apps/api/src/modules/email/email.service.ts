export interface EmailMessage {
  to: string;
  subject: string;
  body: string;
}

/**
 * The seam future modules send through — a welcome e-mail on registration, a
 * password-reset link, an overdue-invoice notice. None of that exists yet;
 * this interface exists so it can be added without touching whichever
 * provider ends up wired in.
 */
export interface EmailService {
  send(message: EmailMessage): Promise<void>;
}

/**
 * Logs instead of sending — the base template ships with no real provider
 * (no SMTP credentials, no third-party dependency to configure). Swapping in
 * a real one later means writing a class that implements `EmailService` and
 * changing the export below; nothing that calls `emailService.send()` changes.
 */
export class NoopEmailService implements EmailService {
  async send(message: EmailMessage): Promise<void> {
    console.log(`[email] to=${message.to} subject=${JSON.stringify(message.subject)}`);
  }
}

export const emailService: EmailService = new NoopEmailService();
