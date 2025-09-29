const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Register new user
router.post('/register', async (req, res) => {
    try {
        const { username, email, password, line_user_id } = req.body;

        // Validate input
        if (!username || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'User ID, email, and password are required'
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 6 characters long'
            });
        }

        // Validate username format (should be alphanumeric and underscores only)
        const userIdRegex = /^[a-zA-Z0-9_]+$/;
        if (!userIdRegex.test(username)) {
            return res.status(400).json({
                success: false,
                message: 'User ID must contain only letters, numbers, and underscores'
            });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid email format'
            });
        }

        // Check if user already exists
        const [existingUsers] = await pool.execute(
            'SELECT id FROM users WHERE username = ? OR email = ?',
            [username, email]
        );

        if (existingUsers.length > 0) {
            return res.status(409).json({
                success: false,
                message: 'User ID or email already exists'
            });
        }

    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Normalize email and check if user should be admin
    const normalizedEmail = String(email).trim().toLowerCase();
    const adminAllowlist = new Set(['km@sabosuku.com', 'haibanosirase@gmail.com']);
    const isAdmin = adminAllowlist.has(normalizedEmail);

        // Create user with LINE ID if provided
        const [result] = await pool.execute(
            'INSERT INTO users (username, email, password_hash, line_user_id, is_admin) VALUES (?, ?, ?, ?, ?)',
            [username, email, passwordHash, line_user_id || null, isAdmin || false]
        );

        // Create default notification preferences
        const lineEnabled = line_user_id ? true : false;
        await pool.execute(
            'INSERT INTO user_notifications (user_id, email_enabled, line_enabled, line_user_id) VALUES (?, true, ?, ?)',
            [result.insertId, lineEnabled, line_user_id || null]
        );

        const token = jwt.sign(
            { userId: result.insertId },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            token,
            user: {
                id: result.insertId,
                username,
                email,
                line_user_id: line_user_id || null
            }
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during registration'
        });
    }
});

// Login user
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        // Validate input
        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: 'Username and password are required'
            });
        }

        // Find user
        const [users] = await pool.execute(
            'SELECT id, username, email, password_hash, is_active, is_admin FROM users WHERE username = ? OR email = ?',
            [username, username]
        );

        if (users.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        const user = users[0];

        // Check if user is active
        if (!user.is_active) {
            return res.status(401).json({
                success: false,
                message: 'Account is deactivated'
            });
        }

        // Verify password
        const isValidPassword = await bcrypt.compare(password, user.password_hash);
        if (!isValidPassword) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Generate JWT token
        const token = jwt.sign(
            { userId: user.id },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            success: true,
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                is_admin: user.is_admin || false
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during login'
        });
    }
});

// Get user profile
router.get('/profile', authenticateToken, async (req, res) => {
    try {
        const [users] = await pool.execute(
            'SELECT id, username, email, line_user_id, is_admin, created_at FROM users WHERE id = ?',
            [req.user.id]
        );

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Get notification preferences
        const [notifications] = await pool.execute(
            'SELECT email_enabled, line_enabled, line_user_id FROM user_notifications WHERE user_id = ?',
            [req.user.id]
        );

        const user = users[0];
        user.notifications = notifications[0] || { email_enabled: true, line_enabled: false };

        res.json({
            success: true,
            user
        });

    } catch (error) {
        console.error('Profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// Update user profile
router.put('/profile', authenticateToken, async (req, res) => {
    try {
        const { email, line_user_id } = req.body;

        // Update user info
        if (email) {
            // Check if email is already taken
            const [existingUsers] = await pool.execute(
                'SELECT id FROM users WHERE email = ? AND id != ?',
                [email, req.user.id]
            );

            if (existingUsers.length > 0) {
                return res.status(409).json({
                    success: false,
                    message: 'Email already exists'
                });
            }

            await pool.execute(
                'UPDATE users SET email = ? WHERE id = ?',
                [email, req.user.id]
            );
        }

        // Update LINE user ID
        if (line_user_id !== undefined) {
            await pool.execute(
                'UPDATE users SET line_user_id = ? WHERE id = ?',
                [line_user_id, req.user.id]
            );

            // Update notification preferences
            await pool.execute(
                `INSERT INTO user_notifications (user_id, line_user_id) 
                 VALUES (?, ?) 
                 ON DUPLICATE KEY UPDATE line_user_id = ?`,
                [req.user.id, line_user_id, line_user_id]
            );
        }

        res.json({
            success: true,
            message: 'Profile updated successfully'
        });

    } catch (error) {
        console.error('Profile update error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// Change password
router.put('/change-password', authenticateToken, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Current password and new password are required'
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'New password must be at least 6 characters long'
            });
        }

        // Get current password hash
        const [users] = await pool.execute(
            'SELECT password_hash FROM users WHERE id = ?',
            [req.user.id]
        );

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Verify current password
        const isValidPassword = await bcrypt.compare(currentPassword, users[0].password_hash);
        if (!isValidPassword) {
            return res.status(401).json({
                success: false,
                message: 'Current password is incorrect'
            });
        }

        // Hash new password
        const saltRounds = 12;
        const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

        // Update password
        await pool.execute(
            'UPDATE users SET password_hash = ? WHERE id = ?',
            [newPasswordHash, req.user.id]
        );

        res.json({
            success: true,
            message: 'Password changed successfully'
        });

    } catch (error) {
        console.error('Password change error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// Verify token
router.get('/verify', authenticateToken, (req, res) => {
    res.json({
        success: true,
        message: 'Token is valid',
        user: req.user
    });
});

module.exports = router;
