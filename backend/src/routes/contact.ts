import { Router, Request, Response } from 'express';
import nodemailer from 'nodemailer';

const router = Router();

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

router.post('/', async (req: Request, res: Response) => {
  const { name, email, message } = req.body as {
    name?: unknown;
    email?: unknown;
    message?: unknown;
  };

  if (
    typeof name !== 'string' || name.trim().length < 2 || name.trim().length > 100 ||
    typeof email !== 'string' || !emailPattern.test(email.trim()) ||
    typeof message !== 'string' || message.trim().length < 10 || message.trim().length > 5000
  ) {
    return res.status(400).json({ error: 'Please provide a valid name, email address, and message.' });
  }

  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, CONTACT_EMAIL } = process.env;
  const destination = CONTACT_EMAIL || SMTP_USER;

  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS || !destination) {
    return res.status(503).json({ error: 'Contact email is not configured yet.' });
  }

  try {
    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT),
      secure: SMTP_PORT === '465',
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    });

    await transporter.sendMail({
      from: `BroFocus Contact <${SMTP_USER}>`,
      to: destination,
      replyTo: email.trim(),
      subject: `BroFocus contact from ${name.trim()}`,
      text: `Name: ${name.trim()}\nEmail: ${email.trim()}\n\nMessage:\n${message.trim()}`,
      html: `<h2>New BroFocus contact message</h2><p><strong>Name:</strong> ${escapeHtml(name.trim())}</p><p><strong>Email:</strong> ${escapeHtml(email.trim())}</p><p><strong>Message:</strong></p><p>${escapeHtml(message.trim()).replace(/\n/g, '<br />')}</p>`,
    });

    return res.status(201).json({ status: 'success', message: 'Your message has been sent.' });
  } catch (error) {
    console.error('[Contact] Email delivery failed:', error);
    return res.status(502).json({ error: 'We could not send your message right now. Please try again later.' });
  }
});

function escapeHtml(value: string): string {
  return value.replace(/[&<>'"]/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;',
  }[character] || character));
}

export default router;