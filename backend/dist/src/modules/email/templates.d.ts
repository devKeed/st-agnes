import { Booking, ServiceType } from '@prisma/client';
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
export interface RecoveryEmailContext {
    clientName: string;
    bookings: Array<{
        manageUrl: string;
        serviceType: ServiceType;
        startTime: Date;
    }>;
    contactEmail?: string;
    contactPhone?: string;
}
export declare function renderRecovery(ctx: RecoveryEmailContext): RenderedEmail;
