const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');

// Middleware to verify JWT token
const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({ 
            success: false, 
            message: 'Access token required' 
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Verify user still exists and is active
        const [users] = await pool.execute(
            'SELECT id, username, email, is_active FROM users WHERE id = ?',
            [decoded.userId]
        );

        if (users.length === 0 || !users[0].is_active) {
            return res.status(401).json({ 
                success: false, 
                message: 'User not found or inactive' 
            });
        }

        req.user = users[0];
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ 
                success: false, 
                message: 'Token expired' 
            });
        }
        
        return res.status(403).json({ 
            success: false, 
            message: 'Invalid token' 
        });
    }
};

// Middleware to check if user is admin (optional)
const requireAdmin = async (req, res, next) => {
    try {
        const [users] = await pool.execute(
            'SELECT is_admin FROM users WHERE id = ?',
            [req.user.id]
        );

        if (users.length === 0 || !users[0].is_admin) {
            return res.status(403).json({ 
                success: false, 
                message: 'Admin access required' 
            });
        }

        next();
    } catch (error) {
        return res.status(500).json({ 
            success: false, 
            message: 'Server error' 
        });
    }
};

module.exports = { authenticateToken, requireAdmin };
