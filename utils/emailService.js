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
      `Your booking is confirmed.`,
      `Event: ${event.title}`,
      `Quantity: ${booking.quantity}`,
      `QR validation code: ${booking.qrCode}`
    ].join('\n')
  });

  return true;
};

module.exports = {
  sendBookingConfirmation
};
