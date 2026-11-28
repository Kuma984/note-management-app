const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const { pool, testConnection } = require('./config/db');
const authRoutes = require('./modules/auth/authRoutes');
const { installNotes } = require('./modules/notes/install');
const advanced = require('./modules/advanced');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Essential middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve only user avatars statically; note attachments pass ownership/share/lock checks
app.use('/uploads/avatars', express.static(path.join(__dirname, '../uploads/avatars')));

// Routes
app.use('/api/auth', authRoutes);
installNotes(app, pool);
advanced.mountRoutes(app);

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.status(200).json({
        status: 'success',
        message: 'Note Management API is healthy and running',
        timestamp: new Date().toISOString()
    });
});

// Start listening and verify DB connection
const server = app.listen(PORT, async () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`API Base URL: http://localhost:${PORT}/api`);
    await testConnection();
});

// WebSocket real-time collaboration (/ws)
advanced.attachRealtime(server);

module.exports = app;
