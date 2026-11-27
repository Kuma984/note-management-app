const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { pool, testConnection } = require('./config/db');
const { installNotes } = require('./modules/notes/install');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Essential middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Attachments must pass note ownership/share/lock checks; never expose uploads statically.
installNotes(app, pool);

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
    await testConnection();
});

module.exports = app;
