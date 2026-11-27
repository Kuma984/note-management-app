const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const db = require('./config/db');
const authRoutes = require('./modules/auth/authRoutes');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Essential middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static uploads (avatars & attachments)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/api/auth', authRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.status(200).json({
        status: 'success',
        message: 'Note Management API is healthy and running',
        timestamp: new Date().toISOString()
    });
});

// Start listening and verify DB connection
app.listen(PORT, async () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`API Base URL: http://localhost:${PORT}/api`);
    await db.testConnection();
});

module.exports = app;