"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderConfirmation = renderConfirmation;
exports.renderReminder = renderReminder;
exports.renderCancellation = renderCancellation;
exports.renderReschedule = renderReschedule;
const SERVICE_LABEL = {
    CUSTOM_DESIGN: 'Custom Design Consultation',
    ALTERATION: 'Alteration Fitting',
    RENTAL: 'Rental Fitting & Pickup',
};
function formatLagos(date) {
    return new Intl.DateTimeFormat('en-NG', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Africa/Lagos',
    }).format(date);
}
function wrap(innerHtml, preheader) {
    return `<!doctype html>
<html><head><meta charset="utf-8"><title>St Agnes</title></head>
<body style="margin:0;padding:0;background:#f5f3ef;font-family:Georgia,serif;color:#1c1c1c;">
  <span style="display:none;max-height:0;overflow:hidden;">${preheader}</span>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border:1px solid #e8e4dc;padding:32px;">
        <tr><td>
          <h1 style="margin:0 0 24px;font-size:24px;letter-spacing:2px;text-transform:uppercase;">St Agnes</h1>
          ${innerHtml}
        </td></tr>
      </table>
      <p style="margin:16px 0 0;font-size:12px;color:#8a8577;">St Agnes · Fashion, reimagined.</p>
    </td></tr>
  </table>
</body></html>`;
}
function detailsBlock(ctx) {
    return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;border-top:1px solid #e8e4dc;border-bottom:1px solid #e8e4dc;">
    <tr><td style="padding:12px 0;"><strong>Service:</strong> ${SERVICE_LABEL[ctx.booking.serviceType]}</td></tr>
    <tr><td style="padding:12px 0;border-top:1px solid #e8e4dc;"><strong>Start:</strong> ${formatLagos(ctx.booking.startTime)}</td></tr>
    <tr><td style="padding:12px 0;border-top:1px solid #e8e4dc;"><strong>End:</strong> ${formatLagos(ctx.booking.endTime)}</td></tr>
  </table>`;
}
function manageButton(url, label) {
    return `<p style="margin:24px 0;"><a href="${url}" style="display:inline-block;padding:12px 24px;background:#1c1c1c;color:#ffffff;text-decoration:none;letter-spacing:1px;text-transform:uppercase;font-size:12px;">${label}</a></p>
  <p style="margin:8px 0;font-size:12px;color:#8a8577;">Or copy this link: ${url}</p>`;
}
function footerContact(ctx) {
    const pieces = [];
    if (ctx.contactEmail)
        pieces.push(ctx.contactEmail);
    if (ctx.contactPhone)
        pieces.push(ctx.contactPhone);
    if (pieces.length === 0)
        return '';
    return `<p style="margin:24px 0 0;font-size:13px;color:#8a8577;">Questions? Reach us at ${pieces.join(' · ')}.</p>`;
}
function renderConfirmation(ctx) {
    const inner = `
    <p>Hi ${ctx.booking.clientName},</p>
    <p>Your booking is confirmed. We look forward to seeing you.</p>
    ${detailsBlock(ctx)}
    <p>You can reschedule or cancel up to 24 hours before your appointment using the link below.</p>
    ${manageButton(ctx.manageUrl, 'Manage booking')}
    ${footerContact(ctx)}
  `;
    return {
        subject: 'Your St Agnes booking is confirmed',
        html: wrap(inner, 'Your St Agnes booking is confirmed.'),
    };
}
function renderReminder(ctx) {
    const inner = `
    <p>Hi ${ctx.booking.clientName},</p>
    <p>This is a gentle reminder that your appointment with St Agnes is coming up.</p>
    ${detailsBlock(ctx)}
    <p>If anything has changed, please let us know as soon as possible.</p>
    ${footerContact(ctx)}
  `;
    return {
        subject: 'Reminder: your St Agnes appointment is tomorrow',
        html: wrap(inner, 'Your St Agnes appointment is tomorrow.'),
    };
}
function renderCancellation(ctx) {
    const reasonLine = ctx.booking.cancellationReason
        ? `<p><strong>Reason:</strong> ${ctx.booking.cancellationReason}</p>`
        : '';
    const inner = `
    <p>Hi ${ctx.booking.clientName},</p>
    <p>Your booking has been cancelled.</p>
    ${detailsBlock(ctx)}
    ${reasonLine}
    <p>We hope to see you again soon.</p>
    ${footerContact(ctx)}
  `;
    return {
        subject: 'Your St Agnes booking has been cancelled',
        html: wrap(inner, 'Your St Agnes booking has been cancelled.'),
    };
}
function renderReschedule(ctx) {
    const inner = `
    <p>Hi ${ctx.booking.clientName},</p>
    <p>Your booking has been rescheduled to the new time below.</p>
    ${detailsBlock(ctx)}
    ${manageButton(ctx.manageUrl, 'Manage booking')}
    ${footerContact(ctx)}
  `;
    return {
        subject: 'Your St Agnes booking has been rescheduled',
        html: wrap(inner, 'Your St Agnes booking has been rescheduled.'),
    };
}
//# sourceMappingURL=templates.js.map