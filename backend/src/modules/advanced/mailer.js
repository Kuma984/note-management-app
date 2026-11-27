/**
 * Best-effort e-mail notification when a note is shared.
 * Needs SMTP_HOST (+ SMTP_PORT, SMTP_USER, SMTP_PASS, MAIL_FROM) in .env.
 * Never throws: sharing must still work when e-mail is not configured.
 */
const nodemailer = require('nodemailer');

let transporter = null;

function getTransporter() {
  if (!process.env.SMTP_HOST) return null;
  if (!transporter) {
    const port = parseInt(process.env.SMTP_PORT, 10) || 587;
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure: port === 465,
      auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
    });
  }
  return transporter;
}

const escapeHtml = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

async function sendShareNotification({ to, ownerName, noteTitle, permission, link }) {
  const t = getTransporter();
  if (!t) return false;
  try {
    const access = permission === 'edit' ? 'view and edit' : 'view (read-only)';
    await t.sendMail({
      from: process.env.MAIL_FROM || process.env.SMTP_USER,
      to,
      subject: `${ownerName} shared a note with you`,
      text: `${ownerName} shared the note "${noteTitle}" with you. You can ${access} it.${link ? `\n\nOpen "Shared with me": ${link}` : ''}`,
      html: `<p><b>${escapeHtml(ownerName)}</b> shared the note <b>${escapeHtml(noteTitle)}</b> with you.</p>
             <p>You can ${access} it.</p>${link ? `<p><a href="${escapeHtml(link)}">Open "Shared with me"</a></p>` : ''}`,
    });
    return true;
  } catch (err) {
    console.error('[advanced] share e-mail failed:', err.message);
    return false;
  }
}

module.exports = { sendShareNotification };
