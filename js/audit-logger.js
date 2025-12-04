/**
 * Audit Logging System
 * Tracks all user actions for accountability and security
 */

class AuditLogger {
    constructor() {
        this.logs = JSON.parse(localStorage.getItem('auditLogs')) || [];
        this.maxLogs = 1000; // Keep last 1000 logs
    }

    /**
     * Log an action
     * @param {string} action - Action performed (CREATE, UPDATE, DELETE, BORROW, RETURN, etc.)
     * @param {string} entityType - Type of entity (BOOK, BORROWER, etc.)
     * @param {string} entityId - ID of the entity
     * @param {object} details - Additional details about the action
     */
    log(action, entityType, entityId, details = {}) {
        const logEntry = {
            id: Date.now().toString(),
            timestamp: new Date().toISOString(),
            action: action,
            entityType: entityType,
            entityId: entityId,
            details: details,
            userAgent: navigator.userAgent,
            url: window.location.href
        };

        this.logs.push(logEntry);

        // Keep only the last maxLogs entries
        if (this.logs.length > this.maxLogs) {
            this.logs = this.logs.slice(-this.maxLogs);
        }

        this.saveLogs();
    }

    /**
     * Save logs to localStorage
     */
    saveLogs() {
        try {
            localStorage.setItem('auditLogs', JSON.stringify(this.logs));
        } catch (e) {
            console.error('Failed to save audit logs:', e);
            // If storage is full, remove oldest logs
            if (e.name === 'QuotaExceededError') {
                this.logs = this.logs.slice(-500);
                localStorage.setItem('auditLogs', JSON.stringify(this.logs));
            }
        }
    }

    /**
     * Get logs filtered by criteria
     * @param {object} filters - Filter criteria
     * @returns {array} - Filtered logs
     */
    getLogs(filters = {}) {
        let filtered = [...this.logs];

        if (filters.action) {
            filtered = filtered.filter(log => log.action === filters.action);
        }

        if (filters.entityType) {
            filtered = filtered.filter(log => log.entityType === filters.entityType);
        }

        if (filters.entityId) {
            filtered = filtered.filter(log => log.entityId === filters.entityId);
        }

        if (filters.startDate) {
            filtered = filtered.filter(log => new Date(log.timestamp) >= new Date(filters.startDate));
        }

        if (filters.endDate) {
            filtered = filtered.filter(log => new Date(log.timestamp) <= new Date(filters.endDate));
        }

        return filtered.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    }

    /**
     * Export logs to JSON
     * @returns {string} - JSON string of logs
     */
    exportLogs() {
        return JSON.stringify(this.logs, null, 2);
    }

    /**
     * Clear old logs (older than specified days)
     * @param {number} days - Number of days to keep
     */
    clearOldLogs(days = 90) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);
        
        this.logs = this.logs.filter(log => new Date(log.timestamp) >= cutoffDate);
        this.saveLogs();
    }
}

