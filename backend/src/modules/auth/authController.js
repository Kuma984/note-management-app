const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const db = require('../../config/db');
const { sendMail } = require('../../config/mailer');

function createToken(user) {
    return jwt.sign(
        { id: user.id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
}

async function register(req, res) {
    try {
        const { email, display_name, password, confirm_password } = req.body;

        if (!email || !display_name || !password || !confirm_password) {
            return res.status(400).json({ success: false, message: 'All fields are required.' });
        }

        if (password !== confirm_password) {
            return res.status(400).json({ success: false, message: 'Passwords do not match.' });
        }

        if (password.length < 6) {
            return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
        }

        const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
        if (existing.length > 0) {
            return res.status(400).json({ success: false, message: 'Email is already registered.' });
        }

        const passwordHash = await bcrypt.hash(password, 10);
        const activationToken = crypto.randomBytes(32).toString('hex');

        const [result] = await db.query(
            'INSERT INTO users (email, password_hash, display_name, is_verified, activation_token) VALUES (?, ?, ?, FALSE, ?)',
            [email, passwordHash, display_name, activationToken]
        );

        const userId = result.insertId;

        await db.query(
            "INSERT INTO user_preferences (user_id, font_size, note_color, theme) VALUES (?, 'medium', '#ffffff', 'light')",
            [userId]
        );

        const clientUrl = process.env.CLIENT_URL || req.headers.origin || 'http://localhost:3000';
        const verifyLink = `${clientUrl}/verify/${activationToken}`;

        sendMail({
            to: email,
            subject: 'Activate your NoteApp account',
            html: `<p>Hi ${display_name},</p><p>Click the link below to activate your account:</p><p><a href="${verifyLink}">${verifyLink}</a></p>`
        }).catch(err => console.error('Activation mail error:', err.message));

        const user = {
            id: userId,
            email,
            display_name,
            avatar_url: null,
            is_verified: false
        };

        const token = createToken(user);

        res.status(201).json({
            success: true,
            message: 'Account created successfully. Please check your email to activate.',
            token,
            user
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error during registration.' });
    }
}

async function verifyEmail(req, res) {
    try {
        const { token } = req.params;
        const [rows] = await db.query('SELECT id FROM users WHERE activation_token = ?', [token]);

        if (rows.length === 0) {
            return res.status(400).json({ success: false, message: 'Invalid or expired activation link.' });
        }

        await db.query(
            'UPDATE users SET is_verified = TRUE, activation_token = NULL WHERE id = ?',
            [rows[0].id]
        );

        res.json({ success: true, message: 'Account activated successfully.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error during verification.' });
    }
}

async function login(req, res) {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Email and password are required.' });
        }

        const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        if (rows.length === 0) {
            return res.status(401).json({ success: false, message: 'Invalid email or password.' });
        }

        const user = rows[0];
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid email or password.' });
        }

        const token = createToken(user);

        res.json({
            success: true,
            message: 'Login successful.',
            token,
            user: {
                id: user.id,
                email: user.email,
                display_name: user.display_name,
                avatar_url: user.avatar_url,
                is_verified: Boolean(user.is_verified)
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error during login.' });
    }
}

async function getMe(req, res) {
    try {
        const [rows] = await db.query(
            `SELECT u.id, u.email, u.display_name, u.avatar_url, u.is_verified,
                    p.font_size, p.note_color, p.theme
             FROM users u
             LEFT JOIN user_preferences p ON u.id = p.user_id
             WHERE u.id = ?`,
            [req.user.id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'User not found.' });
        }

        const u = rows[0];
        res.json({
            success: true,
            user: {
                id: u.id,
                email: u.email,
                display_name: u.display_name,
                avatar_url: u.avatar_url,
                is_verified: Boolean(u.is_verified),
                preferences: {
                    font_size: u.font_size || 'medium',
                    note_color: u.note_color || '#ffffff',
                    theme: u.theme || 'light'
                }
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
}

async function forgotPassword(req, res) {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ success: false, message: 'Email is required.' });
        }

        const [rows] = await db.query('SELECT id, display_name FROM users WHERE email = ?', [email]);
        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'No account found with that email.' });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        await db.query(
            'UPDATE users SET reset_password_otp = ?, reset_password_expires = DATE_ADD(NOW(), INTERVAL 15 MINUTE) WHERE id = ?',
            [otp, rows[0].id]
        );

        await sendMail({
            to: email,
            subject: 'Password Reset OTP - NoteApp',
            html: `<p>Hi ${rows[0].display_name},</p><p>Your password reset OTP is: <b>${otp}</b>. It expires in 15 minutes.</p>`
        });

        res.json({ success: true, message: 'OTP has been sent to your email.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
}

async function resetPassword(req, res) {
    try {
        const { email, otp, new_password, confirm_password } = req.body;

        if (!email || !otp || !new_password || !confirm_password) {
            return res.status(400).json({ success: false, message: 'All fields are required.' });
        }

        if (new_password !== confirm_password) {
            return res.status(400).json({ success: false, message: 'Passwords do not match.' });
        }

        if (new_password.length < 6) {
            return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
        }

        const [rows] = await db.query(
            'SELECT id FROM users WHERE email = ? AND reset_password_otp = ? AND reset_password_expires > NOW()',
            [email, otp]
        );

        if (rows.length === 0) {
            return res.status(400).json({ success: false, message: 'Invalid or expired OTP.' });
        }

        const passwordHash = await bcrypt.hash(new_password, 10);
        await db.query(
            'UPDATE users SET password_hash = ?, reset_password_otp = NULL, reset_password_expires = NULL WHERE id = ?',
            [passwordHash, rows[0].id]
        );

        res.json({ success: true, message: 'Password reset successful. Please log in manually.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
}

async function updateProfile(req, res) {
    try {
        const { display_name } = req.body;
        if (!display_name || !display_name.trim()) {
            return res.status(400).json({ success: false, message: 'Display name is required.' });
        }

        let avatarUrl = undefined;
        if (req.file) {
            avatarUrl = `/uploads/avatars/${req.file.filename}`;
        }

        if (avatarUrl) {
            await db.query('UPDATE users SET display_name = ?, avatar_url = ? WHERE id = ?', [
                display_name.trim(),
                avatarUrl,
                req.user.id
            ]);
        } else {
            await db.query('UPDATE users SET display_name = ? WHERE id = ?', [
                display_name.trim(),
                req.user.id
            ]);
        }

        const [rows] = await db.query(
            'SELECT id, email, display_name, avatar_url, is_verified FROM users WHERE id = ?',
            [req.user.id]
        );

        res.json({
            success: true,
            message: 'Profile updated successfully.',
            user: {
                ...rows[0],
                is_verified: Boolean(rows[0].is_verified)
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error updating profile.' });
    }
}

async function changePassword(req, res) {
    try {
        const { current_password, new_password, confirm_password } = req.body;

        if (!current_password || !new_password || !confirm_password) {
            return res.status(400).json({ success: false, message: 'All fields are required.' });
        }

        if (new_password !== confirm_password) {
            return res.status(400).json({ success: false, message: 'New passwords do not match.' });
        }

        if (new_password.length < 6) {
            return res.status(400).json({ success: false, message: 'New password must be at least 6 characters.' });
        }

        const [rows] = await db.query('SELECT password_hash FROM users WHERE id = ?', [req.user.id]);
        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'User not found.' });
        }

        const isMatch = await bcrypt.compare(current_password, rows[0].password_hash);
        if (!isMatch) {
            return res.status(403).json({ success: false, message: 'Current password is incorrect.' });
        }

        const newHash = await bcrypt.hash(new_password, 10);
        await db.query('UPDATE users SET password_hash = ? WHERE id = ?', [newHash, req.user.id]);

        res.json({ success: true, message: 'Password changed successfully. Please log in again.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
}

async function updatePreferences(req, res) {
    try {
        const { font_size, note_color, theme } = req.body;
        const validSizes = ['small', 'medium', 'large'];
        const validThemes = ['light', 'dark'];

        const size = validSizes.includes(font_size) ? font_size : 'medium';
        const color = note_color || '#ffffff';
        const selectedTheme = validThemes.includes(theme) ? theme : 'light';

        await db.query(
            `INSERT INTO user_preferences (user_id, font_size, note_color, theme)
             VALUES (?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE font_size = VALUES(font_size), note_color = VALUES(note_color), theme = VALUES(theme)`,
            [req.user.id, size, color, selectedTheme]
        );

        res.json({
            success: true,
            message: 'Preferences saved.',
            preferences: { font_size: size, note_color: color, theme: selectedTheme }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
}

module.exports = {
    register,
    verifyEmail,
    login,
    getMe,
    forgotPassword,
    resetPassword,
    updateProfile,
    changePassword,
    updatePreferences
};
