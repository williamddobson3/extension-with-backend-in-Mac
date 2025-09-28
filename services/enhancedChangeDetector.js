const mysql = require('mysql2/promise');

class EnhancedChangeDetector {
    constructor(dbConfig) {
        this.dbConfig = dbConfig;
        this.pool = mysql.createPool(dbConfig);
    }

    /**
     * Comprehensive change detection that compares all aspects of scraped status
     * @param {number} siteId - The site ID to check for changes
     * @returns {Object} Detailed change analysis
     */
    async detectChanges(siteId) {
        try {
            console.log(`🔍 Analyzing changes for site ID: ${siteId}`);

            // Get the last two checks with full details
            const [checks] = await this.pool.execute(`
                SELECT 
                    sc.*,
                    ms.url,
                    ms.name as site_name,
                    ms.keywords
                FROM site_checks sc
                JOIN monitored_sites ms ON sc.site_id = ms.id
                WHERE sc.site_id = ?
                ORDER BY sc.created_at DESC
                LIMIT 2
            `, [siteId]);

            if (checks.length < 2) {
                return {
                    hasChanged: false,
                    reason: 'Not enough historical data for comparison',
                    isFirstCheck: checks.length === 1,
                    currentStatus: checks[0] || null
                };
            }

            const current = checks[0];
            const previous = checks[1];

            console.log(`   📊 Current check: ${current.created_at}`);
            console.log(`   📊 Previous check: ${previous.created_at}`);

            // Perform comprehensive comparison
            const changes = await this.compareScrapedStatus(current, previous);
            
            if (changes.hasChanged) {
                // Save detailed change history
                await this.saveChangeHistory(siteId, previous.id, current.id, changes);
                
                // Update the current check with change information
                await this.updateCheckWithChangeInfo(current.id, changes);
            }

            return changes;

        } catch (error) {
            console.error('❌ Error in change detection:', error);
            throw error;
        }
    }

    /**
     * Compare all aspects of scraped status between current and previous checks
     */
    async compareScrapedStatus(current, previous) {
        const changes = {
            hasChanged: false,
            changeTypes: [],
            changeDetails: [],
            severity: 'low',
            summary: 'No changes detected'
        };

        // 1. Content Hash Comparison
        if (current.content_hash !== previous.content_hash) {
            changes.hasChanged = true;
            changes.changeTypes.push('content');
            changes.changeDetails.push({
                type: 'content',
                description: 'Website content has changed',
                oldValue: previous.content_hash,
                newValue: current.content_hash,
                severity: 'high'
            });
        }

        // 2. Status Code Comparison
        if (current.status_code !== previous.status_code) {
            changes.hasChanged = true;
            changes.changeTypes.push('status');
            const severity = this.getStatusCodeSeverity(current.status_code, previous.status_code);
            changes.changeDetails.push({
                type: 'status',
                description: `HTTP status changed from ${previous.status_code} to ${current.status_code}`,
                oldValue: previous.status_code,
                newValue: current.status_code,
                severity: severity
            });
        }

        // 3. Response Time Comparison
        const responseTimeChange = this.compareResponseTime(current.response_time_ms, previous.response_time_ms);
        if (responseTimeChange.hasChanged) {
            changes.hasChanged = true;
            changes.changeTypes.push('performance');
            changes.changeDetails.push({
                type: 'performance',
                description: responseTimeChange.description,
                oldValue: previous.response_time_ms,
                newValue: current.response_time_ms,
                severity: responseTimeChange.severity
            });
        }

        // 4. Keywords Comparison
        const keywordChanges = this.compareKeywords(current, previous);
        if (keywordChanges.hasChanged) {
            changes.hasChanged = true;
            changes.changeTypes.push('keywords');
            changes.changeDetails.push({
                type: 'keywords',
                description: keywordChanges.description,
                oldValue: previous.keywords_list,
                newValue: current.keywords_list,
                severity: keywordChanges.severity
            });
        }

        // 5. Scraping Method Comparison
        if (current.scraping_method !== previous.scraping_method) {
            changes.hasChanged = true;
            changes.changeTypes.push('method');
            changes.changeDetails.push({
                type: 'method',
                description: `Scraping method changed from ${previous.scraping_method} to ${current.scraping_method}`,
                oldValue: previous.scraping_method,
                newValue: current.scraping_method,
                severity: 'medium'
            });
        }

        // 6. Error Status Comparison
        const errorChanges = this.compareErrorStatus(current, previous);
        if (errorChanges.hasChanged) {
            changes.hasChanged = true;
            changes.changeTypes.push('error');
            changes.changeDetails.push({
                type: 'error',
                description: errorChanges.description,
                oldValue: previous.error_message,
                newValue: current.error_message,
                severity: errorChanges.severity
            });
        }

        // Determine overall severity
        if (changes.hasChanged) {
            changes.severity = this.determineOverallSeverity(changes.changeDetails);
            changes.summary = this.generateChangeSummary(changes);
        }

        return changes;
    }

    /**
     * Compare response times and determine if change is significant
     */
    compareResponseTime(currentTime, previousTime) {
        if (!currentTime || !previousTime) {
            return { hasChanged: false };
        }

        const changePercent = Math.abs(currentTime - previousTime) / previousTime * 100;
        
        if (changePercent > 50) { // More than 50% change
            const direction = currentTime > previousTime ? 'slower' : 'faster';
            return {
                hasChanged: true,
                description: `Response time became ${direction} (${changePercent.toFixed(1)}% change)`,
                severity: changePercent > 100 ? 'high' : 'medium'
            };
        }

        return { hasChanged: false };
    }

    /**
     * Compare keyword detection results
     */
    compareKeywords(current, previous) {
        const currentKeywords = current.keywords_found;
        const previousKeywords = previous.keywords_found;

        if (currentKeywords !== previousKeywords) {
            const direction = currentKeywords ? 'appeared' : 'disappeared';
            return {
                hasChanged: true,
                description: `Keywords ${direction}`,
                severity: 'medium'
            };
        }

        // Check if specific keywords changed (if keywords_list is stored)
        if (current.keywords_list && previous.keywords_list) {
            try {
                const currentList = JSON.parse(current.keywords_list);
                const previousList = JSON.parse(previous.keywords_list);
                
                if (JSON.stringify(currentList.sort()) !== JSON.stringify(previousList.sort())) {
                    return {
                        hasChanged: true,
                        description: 'Specific keywords changed',
                        severity: 'medium'
                    };
                }
            } catch (e) {
                // Ignore JSON parsing errors
            }
        }

        return { hasChanged: false };
    }

    /**
     * Compare error status between checks
     */
    compareErrorStatus(current, previous) {
        const currentError = current.error_message;
        const previousError = previous.error_message;

        // Site went from error to working
        if (previousError && !currentError) {
            return {
                hasChanged: true,
                description: 'Site recovered from error',
                severity: 'high'
            };
        }

        // Site went from working to error
        if (!previousError && currentError) {
            return {
                hasChanged: true,
                description: 'Site encountered an error',
                severity: 'critical'
            };
        }

        // Error message changed
        if (currentError && previousError && currentError !== previousError) {
            return {
                hasChanged: true,
                description: 'Error message changed',
                severity: 'medium'
            };
        }

        return { hasChanged: false };
    }

    /**
     * Determine severity based on status code changes
     */
    getStatusCodeSeverity(currentCode, previousCode) {
        // Critical: Site went down (200 -> 4xx/5xx)
        if (previousCode === 200 && currentCode >= 400) {
            return 'critical';
        }

        // High: Site recovered (4xx/5xx -> 200)
        if (previousCode >= 400 && currentCode === 200) {
            return 'high';
        }

        // Medium: Status code changed but both are errors
        if (previousCode >= 400 && currentCode >= 400) {
            return 'medium';
        }

        // Low: Minor status code changes
        return 'low';
    }

    /**
     * Determine overall severity based on all changes
     */
    determineOverallSeverity(changeDetails) {
        const severities = changeDetails.map(change => change.severity);
        
        if (severities.includes('critical')) return 'critical';
        if (severities.includes('high')) return 'high';
        if (severities.includes('medium')) return 'medium';
        return 'low';
    }

    /**
     * Generate a human-readable summary of all changes
     */
    generateChangeSummary(changes) {
        const typeCounts = {};
        changes.changeTypes.forEach(type => {
            typeCounts[type] = (typeCounts[type] || 0) + 1;
        });

        const summaries = [];
        if (typeCounts.content) summaries.push('content changed');
        if (typeCounts.status) summaries.push('status changed');
        if (typeCounts.performance) summaries.push('performance changed');
        if (typeCounts.keywords) summaries.push('keywords changed');
        if (typeCounts.method) summaries.push('scraping method changed');
        if (typeCounts.error) summaries.push('error status changed');

        return summaries.join(', ');
    }

    /**
     * Save detailed change history to database
     */
    async saveChangeHistory(siteId, previousCheckId, currentCheckId, changes) {
        try {
            for (const change of changes.changeDetails) {
                await this.pool.execute(`
                    INSERT INTO change_history 
                    (site_id, previous_check_id, current_check_id, change_type, change_description, old_value, new_value, severity)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                `, [
                    siteId,
                    previousCheckId,
                    currentCheckId,
                    change.type,
                    change.description,
                    change.oldValue,
                    change.newValue,
                    change.severity
                ]);
            }
            console.log(`   📝 Saved ${changes.changeDetails.length} change records`);
        } catch (error) {
            console.error('❌ Error saving change history:', error);
        }
    }

    /**
     * Update site check record with change information
     */
    async updateCheckWithChangeInfo(checkId, changes) {
        try {
            await this.pool.execute(`
                UPDATE site_checks 
                SET changes_detected = TRUE, 
                    change_type = ?, 
                    change_reason = ?
                WHERE id = ?
            `, [
                changes.changeTypes.join(','),
                changes.summary,
                checkId
            ]);
        } catch (error) {
            console.error('❌ Error updating check with change info:', error);
        }
    }

    /**
     * Get change history for a site
     */
    async getChangeHistory(siteId, limit = 10) {
        try {
            const [history] = await this.pool.execute(`
                SELECT 
                    ch.*,
                    sc_current.created_at as current_check_time,
                    sc_previous.created_at as previous_check_time
                FROM change_history ch
                LEFT JOIN site_checks sc_current ON ch.current_check_id = sc_current.id
                LEFT JOIN site_checks sc_previous ON ch.previous_check_id = sc_previous.id
                WHERE ch.site_id = ?
                ORDER BY ch.detected_at DESC
                LIMIT ?
            `, [siteId, limit]);

            return history;
        } catch (error) {
            console.error('❌ Error getting change history:', error);
            return [];
        }
    }

    /**
     * Get detailed comparison between two specific checks
     */
    async getDetailedComparison(checkId1, checkId2) {
        try {
            const [checks] = await this.pool.execute(`
                SELECT 
                    sc.*,
                    ms.url,
                    ms.name as site_name
                FROM site_checks sc
                JOIN monitored_sites ms ON sc.site_id = ms.id
                WHERE sc.id IN (?, ?)
                ORDER BY sc.created_at ASC
            `, [checkId1, checkId2]);

            if (checks.length !== 2) {
                throw new Error('Could not find both checks for comparison');
            }

            const previous = checks[0];
            const current = checks[1];

            return await this.compareScrapedStatus(current, previous);
        } catch (error) {
            console.error('❌ Error getting detailed comparison:', error);
            throw error;
        }
    }
}

module.exports = EnhancedChangeDetector;
