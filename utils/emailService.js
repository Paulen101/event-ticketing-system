const nodemailer = require('nodemailer');

const hasEmailConfig = () => {
  return Boolean(
    process.env.SMTP_HOST &&
      process.env.SMTP_PORT &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASS &&
      process.env.EMAIL_FROM
  );
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
    filename: 'ticket-qr.png',
    content: Buffer.from(match[1], 'base64'),
    cid: 'booking-qr'
  };
};

const sendBookingConfirmation = async ({ to, booking, event }) => {
  if (!hasEmailConfig() || !to) {
    return false;
  }

  const qrAttachment = getQrAttachment(booking);

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject: `Booking confirmed: ${event.title}`,
    text: [
      'Your booking is confirmed.',
      `Event: ${event.title}`,
      `When: ${formatEventDate(event)}`,
      `Venue: ${event.venue || 'TBD'}`,
      `Quantity: ${booking.quantity}`,
      `Booking ID: ${booking._id}`,
      `QR validation code: ${booking.qrCode}`,
      qrAttachment ? 'The QR code is included in the HTML version of this email.' : '',
      '',
      'Please keep this email for check-in.'
    ].filter(Boolean).join('\n'),
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
      ${
        qrAttachment
          ? `
      <p><strong>Scan this QR code at check-in:</strong></p>
      <p><img src="cid:booking-qr" alt="Booking QR code" width="180" height="180" style="display:block;border:1px solid #d1d5db;border-radius:8px;padding:8px;" /></p>
      `
          : ''
      }
      <p>Please keep this email for check-in.</p>
    `,
    attachments: qrAttachment ? [qrAttachment] : []
  });

  return true;
};

module.exports = {
  sendBookingConfirmation
};
