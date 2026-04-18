import { Provider } from '@nestjs/common';
import { Resend } from 'resend';
export declare const RESEND: unique symbol;
export type ResendClient = Resend | null;
export declare const ResendProvider: Provider<ResendClient>;
