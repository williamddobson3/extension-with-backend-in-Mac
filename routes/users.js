const express = require('express');
const { pool } = require('../config/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Get all users (admin only)
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const [users] = await pool.execute(`
            SELECT 
                u.id, 
                u.username, 
                u.email, 
                u.line_user_id, 
                u.is_active, 
                u.is_admin, 
                u.created_at,
                COUNT(ms.id) as site_count
            FROM users u
            LEFT JOIN monitored_sites ms ON u.id = ms.user_id
            GROUP BY u.id
            ORDER BY u.created_at DESC
        `);

        res.json({
            success: true,
            users: users.map(user => ({
                id: user.id,
                username: user.username,
                email: user.email,
                line_user_id: user.line_user_id,
                is_active: user.is_active,
                is_admin: user.is_admin,
                created_at: user.created_at,
                site_count: user.site_count
            }))
        });
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// Delete user (admin only)
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        
        if (isNaN(userId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid user ID'
            });
        }

        // Check if user exists
        const [users] = await pool.execute(
            'SELECT id, is_admin FROM users WHERE id = ?',
            [userId]
        );

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Prevent deleting other admins
        if (users[0].is_admin) {
            return res.status(403).json({
                success: false,
                message: 'Cannot delete admin users'
            });
        }

        // Delete user (cascade will handle related records)
        await pool.execute('DELETE FROM users WHERE id = ?', [userId]);

        res.json({
            success: true,
            message: 'ユーザーが正常に削除されました'
        });
    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// Toggle user active status (admin only)
router.put('/:id/toggle-active', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        
        if (isNaN(userId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid user ID'
            });
        }

        // Check if user exists
        const [users] = await pool.execute(
            'SELECT id, is_admin, is_active FROM users WHERE id = ?',
            [userId]
        );

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Prevent deactivating other admins
        if (users[0].is_admin) {
            return res.status(403).json({
                success: false,
                message: 'Cannot deactivate admin users'
            });
        }

        // Toggle active status
        const newStatus = !users[0].is_active;
        await pool.execute(
            'UPDATE users SET is_active = ? WHERE id = ?',
            [newStatus, userId]
        );

        res.json({
            success: true,
            message: `User ${newStatus ? 'activated' : 'deactivated'} successfully`,
            is_active: newStatus
        });
    } catch (error) {
        console.error('Toggle user active error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

module.exports = router;
