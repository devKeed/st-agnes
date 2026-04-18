import { Logger, Provider } from '@nestjs/common';
import { Resend } from 'resend';

export const RESEND = Symbol('RESEND');

export type ResendClient = Resend;

export const ResendProvider: Provider<ResendClient> = {
  provide: RESEND,
  useFactory: (): ResendClient => {
    const logger = new Logger('ResendProvider');
    const apiKey = process.env.RESEND_API_KEY;

    if (!apiKey) {
      logger.warn(
        'RESEND_API_KEY is not set. Outbound email will be logged as FAILED until configured.',
      );
    }

    return new Resend(apiKey ?? 'missing-api-key');
  },
};
