const dns = require('dns');
const nodemailer = require('nodemailer');

const dnsPromises = dns.promises;

const getEmailConfig = () => {
  const port = Number(process.env.SMTP_PORT || 587);
  const from = process.env.EMAIL_FROM || process.env.SMTP_USER;
  const secure =
    process.env.SMTP_SECURE === undefined
      ? port === 465
      : process.env.SMTP_SECURE === 'true';

  return {
    host: process.env.SMTP_HOST,
    port,
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from,
    secure
  };
};

const getEmailConfigStatus = () => {
  const config = getEmailConfig();
  const missing = [];

  if (!config.host) missing.push('SMTP_HOST');
  if (!config.port || Number.isNaN(config.port)) missing.push('SMTP_PORT');
  if (!config.user) missing.push('SMTP_USER');
  if (!config.pass) missing.push('SMTP_PASS');
  if (!config.from) missing.push('EMAIL_FROM or SMTP_USER');

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
    filename: 'ticket-qr.png',
    content: Buffer.from(match[1], 'base64'),
    cid: 'booking-qr'
  };
};

const createEmailTransporter = async () => {
  const emailConfig = getEmailConfig();
  let smtpHost = emailConfig.host;

  try {
    const addresses = await dnsPromises.resolve4(emailConfig.host);

    if (addresses.length > 0) {
      smtpHost = addresses[0];
    }
  } catch (error) {
    console.warn(`Could not resolve IPv4 SMTP host ${emailConfig.host}: ${error.message}`);
  }

  return nodemailer.createTransport({
    host: smtpHost,
    port: emailConfig.port,
    secure: emailConfig.secure,
    servername: emailConfig.host,
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
    tls: {
      servername: emailConfig.host
    },
    auth: {
      user: emailConfig.user,
      pass: emailConfig.pass
    }
  });
};

const sendBookingConfirmation = async ({ to, booking, event }) => {
  const emailConfigStatus = getEmailConfigStatus();

  if (!emailConfigStatus.configured || !to) {
    return false;
  }

  const qrAttachment = getQrAttachment(booking);
  const transporter = await createEmailTransporter();

  await transporter.sendMail({
    from: getEmailConfig().from,
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

const verifyEmailConnection = async () => {
  const emailConfigStatus = getEmailConfigStatus();

  if (!emailConfigStatus.configured) {
    return {
      ok: false,
      missing: emailConfigStatus.missing,
      error: 'SMTP is not fully configured'
    };
  }

  const transporter = await createEmailTransporter();

  try {
    await transporter.verify();

    return {
      ok: true,
      missing: []
    };
  } catch (error) {
    return {
      ok: false,
      missing: [],
      error: error.message,
      code: error.code,
      command: error.command,
      responseCode: error.responseCode
    };
  }
};

module.exports = {
  getEmailConfigStatus,
  sendBookingConfirmation,
  verifyEmailConnection
};
