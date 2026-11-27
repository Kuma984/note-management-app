const nodemailer = require('nodemailer');

let transporter = null;

if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    transporter = nodemailer.createTransport({
        service: process.env.EMAIL_SERVICE || 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });
}

async function sendMail({ to, subject, html }) {
    // If SMTP is not configured in .env, log to console so local testing still works
    if (!transporter) {
        console.log('--- EMAIL PREVIEW (SMTP not configured) ---');
        console.log('To:', to);
        console.log('Subject:', subject);
        console.log('Content:', html);
        console.log('-------------------------------------------');
        return;
    }

    await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to,
        subject,
        html
    });
}

module.exports = { sendMail };
