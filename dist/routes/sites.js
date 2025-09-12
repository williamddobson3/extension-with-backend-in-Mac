const express = require('express');
const { pool } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const websiteMonitor = require('../services/websiteMonitor');
const schedulerService = require('../services/schedulerService');
const adminNotificationService = require('../services/adminNotificationService');

const router = express.Router();

// Get all monitored sites for user
router.get('/', authenticateToken, async (req, res) => {
    try {
        const [sites] = await pool.execute(
            `SELECT id, url, name, check_interval_hours, keywords, is_active, 
                    last_check, created_at, updated_at
             FROM monitored_sites 
             WHERE user_id = ? 
             ORDER BY created_at DESC`,
            [req.user.id]
        );

        // Get latest check results for each site
        const sitesWithChecks = await Promise.all(
            sites.map(async (site) => {
                const [checks] = await pool.execute(
                    `SELECT content_hash, content_length, status_code, 
                            response_time_ms, changes_detected, created_at
                     FROM site_checks 
                     WHERE site_id = ? 
                     ORDER BY created_at DESC 
                     LIMIT 1`,
                    [site.id]
                );

                return {
                    ...site,
                    last_check_result: checks[0] || null
                };
            })
        );

        res.json({
            success: true,
            sites: sitesWithChecks
        });

    } catch (error) {
        console.error('Get sites error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// Get single monitored site
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;

        const [sites] = await pool.execute(
            `SELECT id, url, name, check_interval_hours, keywords, is_active, 
                    last_check, created_at, updated_at
             FROM monitored_sites 
             WHERE id = ? AND user_id = ?`,
            [id, req.user.id]
        );

        if (sites.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Site not found'
            });
        }

        // Get check history
        const [checks] = await pool.execute(
            `SELECT content_hash, content_length, status_code, 
                    response_time_ms, changes_detected, created_at
             FROM site_checks 
             WHERE site_id = ? 
             ORDER BY created_at DESC 
             LIMIT 10`,
            [id]
        );

        const site = sites[0];
        site.check_history = checks;

        res.json({
            success: true,
            site
        });

    } catch (error) {
        console.error('Get site error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// Add new monitored site
router.post('/', authenticateToken, async (req, res) => {
    try {
        const { url, name, check_interval_hours = 24, keywords } = req.body;

        // Validate input
        if (!url || !name) {
            return res.status(400).json({
                success: false,
                message: 'URL and name are required'
            });
        }

        // Validate URL format
        try {
            new URL(url);
        } catch (error) {
            return res.status(400).json({
                success: false,
                message: 'Invalid URL format'
            });
        }

        // Validate check interval
        if (check_interval_hours < 1 || check_interval_hours > 168) { // 1 hour to 1 week
            return res.status(400).json({
                success: false,
                message: 'Check interval must be between 1 and 168 hours'
            });
        }

        // Check if site already exists for this user
        const [existingSites] = await pool.execute(
            'SELECT id FROM monitored_sites WHERE url = ? AND user_id = ?',
            [url, req.user.id]
        );

        if (existingSites.length > 0) {
            return res.status(409).json({
                success: false,
                message: 'This URL is already being monitored'
            });
        }

        // Create new monitored site
        const [result] = await pool.execute(
            'INSERT INTO monitored_sites (user_id, url, name, check_interval_hours, keywords) VALUES (?, ?, ?, ?, ?)',
            [req.user.id, url, name, check_interval_hours, keywords]
        );

        // Perform initial check
        const checkResult = await websiteMonitor.checkWebsite(result.insertId, url, keywords);

        // Send admin notification
        const siteData = {
            id: result.insertId,
            url,
            name,
            check_interval_hours,
            keywords,
            is_active: true
        };
        
        try {
            await adminNotificationService.notifySiteAdded(siteData, req.user.email);
        } catch (error) {
            console.error('Admin notification failed:', error);
            // Don't fail the request if admin notification fails
        }

        res.status(201).json({
            success: true,
            message: 'Site added successfully',
            site: {
                id: result.insertId,
                url,
                name,
                check_interval_hours,
                keywords,
                is_active: true,
                initial_check: checkResult
            }
        });

    } catch (error) {
        console.error('Add site error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// Update monitored site
router.put('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { url, name, check_interval_hours, keywords, is_active } = req.body;

        // Check if site exists and belongs to user
        const [sites] = await pool.execute(
            'SELECT id FROM monitored_sites WHERE id = ? AND user_id = ?',
            [id, req.user.id]
        );

        if (sites.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Site not found'
            });
        }

        // Build update query
        const updates = [];
        const values = [];

        if (url !== undefined) {
            try {
                new URL(url);
                updates.push('url = ?');
                values.push(url);
            } catch (error) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid URL format'
                });
            }
        }

        if (name !== undefined) {
            updates.push('name = ?');
            values.push(name);
        }

        if (check_interval_hours !== undefined) {
            if (check_interval_hours < 1 || check_interval_hours > 168) {
                return res.status(400).json({
                    success: false,
                    message: 'Check interval must be between 1 and 168 hours'
                });
            }
            updates.push('check_interval_hours = ?');
            values.push(check_interval_hours);
        }

        if (keywords !== undefined) {
            updates.push('keywords = ?');
            values.push(keywords);
        }

        if (is_active !== undefined) {
            updates.push('is_active = ?');
            values.push(is_active);
        }

        if (updates.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No fields to update'
            });
        }

        values.push(id);

        // Update site
        await pool.execute(
            `UPDATE monitored_sites SET ${updates.join(', ')}, updated_at = NOW() WHERE id = ?`,
            values
        );

        res.json({
            success: true,
            message: 'Site updated successfully'
        });

    } catch (error) {
        console.error('Update site error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// Delete monitored site
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;

        // Check if site exists and belongs to user
        const [sites] = await pool.execute(
            'SELECT id, url, name, check_interval_hours, keywords FROM monitored_sites WHERE id = ? AND user_id = ?',
            [id, req.user.id]
        );

        if (sites.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Site not found'
            });
        }

        const siteData = sites[0];

        // Send admin notification before deletion
        try {
            await adminNotificationService.notifySiteDeleted(siteData, req.user.email);
        } catch (error) {
            console.error('Admin notification failed:', error);
            // Don't fail the request if admin notification fails
        }

        // Delete site (cascade will delete related records)
        await pool.execute(
            'DELETE FROM monitored_sites WHERE id = ?',
            [id]
        );

        res.json({
            success: true,
            message: 'Site deleted successfully'
        });

    } catch (error) {
        console.error('Delete site error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// Manual check for a site
router.post('/:id/check', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;

        // Check if site exists and belongs to user
        const [sites] = await pool.execute(
            'SELECT id, url, keywords FROM monitored_sites WHERE id = ? AND user_id = ?',
            [id, req.user.id]
        );

        if (sites.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Site not found'
            });
        }

        const site = sites[0];

        // Perform manual check
        const checkResult = await websiteMonitor.checkWebsite(site.id, site.url, site.keywords);

        if (!checkResult.success) {
            return res.status(500).json({
                success: false,
                message: 'Check failed',
                error: checkResult.error
            });
        }

        // Check for changes
        const changeResult = await websiteMonitor.detectChanges(site.id);

        res.json({
            success: true,
            message: 'Manual check completed',
            check_result: checkResult,
            changes_detected: changeResult.hasChanged,
            change_reason: changeResult.reason
        });

    } catch (error) {
        console.error('Manual check error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// Get check history for a site
router.get('/:id/history', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { limit = 50 } = req.query;

        // Check if site exists and belongs to user
        const [sites] = await pool.execute(
            'SELECT id FROM monitored_sites WHERE id = ? AND user_id = ?',
            [id, req.user.id]
        );

        if (sites.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Site not found'
            });
        }

        // Get check history
        const [checks] = await pool.execute(
            `SELECT content_hash, content_length, status_code, 
                    response_time_ms, changes_detected, created_at
             FROM site_checks 
             WHERE site_id = ? 
             ORDER BY created_at DESC 
             LIMIT ?`,
            [id, parseInt(limit)]
        );

        res.json({
            success: true,
            history: checks
        });

    } catch (error) {
        console.error('Get history error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

module.exports = router;
