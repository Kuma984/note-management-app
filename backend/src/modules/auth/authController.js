const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const db = require('../../config/db');

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
            message: 'Account created successfully.',
            token,
            user
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error during registration.' });
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

module.exports = { register, login, getMe };
