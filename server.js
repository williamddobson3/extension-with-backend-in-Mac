const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

// Provide a stable fetch implementation for server-side code (use node-fetch v2 which works with CommonJS)
try {
    // eslint-disable-next-line global-require
    const fetch = require('node-fetch');
    if (!global.fetch) {
        global.fetch = fetch;
    }
} catch (err) {
    console.warn('node-fetch not available, falling back to global.fetch if present');
}

const { testConnection } = require('./config/database');
const schedulerService = require('./services/schedulerService');

// Import routes
const authRoutes = require('./routes/auth');
const sitesRoutes = require('./routes/sites');
const notificationsRoutes = require('./routes/notifications');
const lineRoutes = require('./routes/line');
const usersRoutes = require('./routes/users');

const app = express();
const PORT = process.env.PORT || 3003;

// Trust proxy for production deployments behind reverse proxies
if (process.env.NODE_ENV === 'production' || process.env.TRUST_PROXY === 'true') {
    app.set('trust proxy', 1);
}

// Security middleware
app.use(helmet({
    contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false,
    crossOriginEmbedderPolicy: false
}));

// CORS configuration
const corsOptions = {
    origin: function (origin, callback) {
        // Allow requests with no origin (mobile apps, postman, etc.)
        if (!origin) return callback(null, true);
        
        const allowedOrigins = process.env.NODE_ENV === 'production' 
            ? [
                /^chrome-extension:\/\/.*$/,
                /^moz-extension:\/\/.*$/,
                process.env.FRONTEND_URL,
                process.env.ADMIN_URL
              ].filter(Boolean)
            : [
                'http://localhost:3000',
                'http://localhost:3001',
                'http://127.0.0.1:3000',
                /^chrome-extension:\/\/.*$/,
                /^moz-extension:\/\/.*$/
              ];

        // Check if origin matches any allowed pattern
        const isAllowed = allowedOrigins.some(allowedOrigin => {
            if (typeof allowedOrigin === 'string') {
                return origin === allowedOrigin;
            } else if (allowedOrigin instanceof RegExp) {
                return allowedOrigin.test(origin);
            }
            return false;
        });

        if (isAllowed) {
            callback(null, true);
        } else {
            console.warn(`CORS blocked origin: ${origin}`);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    optionsSuccessStatus: 200 // Some legacy browsers choke on 204
};

app.use(cors(corsOptions));

// Rate limiting


// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files
app.use(express.static('public'));

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'Server is running',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/sites', sitesRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/line', lineRoutes);
app.use('/api/users', usersRoutes);

// Admin page route
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Admin routes (optional)
app.get('/api/admin/status', async (req, res) => {
    try {
        const schedulerStatus = schedulerService.getStatus();
        res.json({
            success: true,
            scheduler: schedulerStatus,
            server: {
                uptime: process.uptime(),
                memory: process.memoryUsage(),
                version: process.version
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// Manual scheduler control (admin only)
app.post('/api/admin/scheduler/start', async (req, res) => {
    try {
        schedulerService.start();
        res.json({
            success: true,
            message: 'Scheduler started'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to start scheduler'
        });
    }
});

app.post('/api/admin/scheduler/stop', async (req, res) => {
    try {
        schedulerService.stop();
        res.json({
            success: true,
            message: 'Scheduler stopped'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to stop scheduler'
        });
    }
});

// 404 handler
app.use('/', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'Endpoint not found'
    });
});

// Global error handler
app.use((error, req, res, next) => {
    console.error('Global error handler:', error);
    
    res.status(error.status || 500).json({
        success: false,
        message: error.message || 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    });
});

// Start server
const HOST = process.env.HOST || '0.0.0.0';
let server;
const startServer = async () => {
    try {
        // Test database connection
        await testConnection();
        
        // Start the server (bind to HOST so it can accept external connections)
        server = app.listen(PORT, HOST, () => {
            console.log(`🚀 Server running on ${HOST}:${PORT}`);
            console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
            const publicHost = process.env.PUBLIC_HOST || HOST;
            console.log(`🔗 Health check: http://${publicHost}:${PORT}/health`);
        });

        // Start the scheduler
        schedulerService.start();

    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
};

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('🛑 SIGTERM received, shutting down gracefully...');
    schedulerService.stop();
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('🛑 SIGINT received, shutting down gracefully...');
    schedulerService.stop();
    process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});

// Start the server
startServer();
