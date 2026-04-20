import { Booking } from '@prisma/client';
export interface RenderedEmail {
    subject: string;
    html: string;
}
export interface TemplateContext {
    booking: Pick<Booking, 'clientName' | 'clientEmail' | 'serviceType' | 'startTime' | 'endTime' | 'manageToken' | 'cancellationReason'>;
    manageUrl: string;
    contactEmail?: string;
    contactPhone?: string;
}
export declare function renderConfirmation(ctx: TemplateContext): RenderedEmail;
export declare function renderReminder(ctx: TemplateContext): RenderedEmail;
export declare function renderCancellation(ctx: TemplateContext): RenderedEmail;
export declare function renderReschedule(ctx: TemplateContext): RenderedEmail;
