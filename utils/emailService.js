const RESEND_EMAILS_URL = 'https://api.resend.com/emails';

const getEmailConfig = () => {
  return {
    apiKey: process.env.RESEND_API_KEY,
    from: process.env.EMAIL_FROM
  };
};

const getEmailConfigStatus = () => {
  const config = getEmailConfig();
  const missing = [];

  if (!config.apiKey) missing.push('RESEND_API_KEY');
  if (!config.from) missing.push('EMAIL_FROM');

  return {
    configured: missing.length === 0,
    missing
  };
};

const escapeHtml = (value) => {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
};

const formatEventDate = (event) => {
  const date = event.date ? new Date(event.date).toLocaleDateString() : 'TBD';
  return event.time ? `${date} at ${event.time}` : date;
};

const getQrAttachment = (booking) => {
  const match = String(booking.qrImage || '').match(/^data:image\/png;base64,(.+)$/);

  if (!match) {
    return null;
  }

  return {
    content: match[1],
    filename: 'ticket-qr.png',
    contentId: 'booking-qr'
  };
};

const createBookingEmailPayload = ({ to, booking, event }) => {
  const qrAttachment = getQrAttachment(booking);
  const qrImageHtml = qrAttachment
    ? `
      <p><strong>Scan this QR code at check-in:</strong></p>
      <p><img src="cid:booking-qr" alt="Booking QR code" width="180" height="180" style="display:block;border:1px solid #d1d5db;border-radius:8px;padding:8px;" /></p>
      `
    : '';

  return {
    from: getEmailConfig().from,
    to: [to],
    subject: `Booking confirmed: ${event.title}`,
    text: [
      'Your booking is confirmed.',
      `Event: ${event.title}`,
      `When: ${formatEventDate(event)}`,
      `Venue: ${event.venue || 'TBD'}`,
      `Quantity: ${booking.quantity}`,
      `Booking ID: ${booking._id}`,
      `QR validation code: ${booking.qrCode}`,
      '',
      'Please keep this email for check-in.'
    ].join('\n'),
    html: `
      <h1>Booking confirmed</h1>
      <p>Your tickets are ready for <strong>${escapeHtml(event.title)}</strong>.</p>
      <ul>
        <li><strong>When:</strong> ${escapeHtml(formatEventDate(event))}</li>
        <li><strong>Venue:</strong> ${escapeHtml(event.venue || 'TBD')}</li>
        <li><strong>Quantity:</strong> ${booking.quantity}</li>
        <li><strong>Booking ID:</strong> ${booking._id}</li>
        <li><strong>QR validation code:</strong> ${escapeHtml(booking.qrCode)}</li>
      </ul>
      ${qrImageHtml}
      <p>Please keep this email for check-in.</p>
    `,
    attachments: qrAttachment ? [qrAttachment] : []
  };
};

const parseResendResponse = async (response) => {
  const text = await response.text();

  if (!text) {
    return {};
  }

  try {
    return JSON.parse(text);
  } catch (error) {
    return { message: text };
  }
};

const sendResendEmail = async (payload) => {
  const config = getEmailConfig();
  const response = await fetch(RESEND_EMAILS_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });
  const body = await parseResendResponse(response);

  if (!response.ok) {
    const message = body.message || body.error || `Resend API returned ${response.status}`;
    const error = new Error(message);
    error.status = response.status;
    error.response = body;
    throw error;
  }

  return body;
};

const sendBookingConfirmation = async ({ to, booking, event }) => {
  const emailConfigStatus = getEmailConfigStatus();

  if (!emailConfigStatus.configured || !to) {
    return false;
  }

  await sendResendEmail(createBookingEmailPayload({ to, booking, event }));

  return true;
};

const verifyEmailConnection = async () => {
  const emailConfigStatus = getEmailConfigStatus();

  if (!emailConfigStatus.configured) {
    return {
      ok: false,
      missing: emailConfigStatus.missing,
      error: 'Resend is not fully configured'
    };
  }

  try {
    const response = await fetch('https://api.resend.com/domains', {
      headers: {
        Authorization: `Bearer ${getEmailConfig().apiKey}`
      }
    });
    const body = await parseResendResponse(response);

    return {
      ok: response.ok,
      missing: [],
      error: response.ok ? undefined : body.message || body.error || `Resend API returned ${response.status}`,
      status: response.status
    };
  } catch (error) {
    return {
      ok: false,
      missing: [],
      error: error.message
    };
  }
};

module.exports = {
  getEmailConfigStatus,
  sendBookingConfirmation,
  verifyEmailConnection
};
