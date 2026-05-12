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

const sendBookingConfirmation = async ({ to, booking, event }) => {
  if (!hasEmailConfig() || !to) {
    return false;
  }

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
      <p>Please keep this email for check-in.</p>
    `
  });

  return true;
};

module.exports = {
  sendBookingConfirmation
};
