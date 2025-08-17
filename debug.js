// Debug Manager for enhanced logging and debugging
export class DebugManager {
    static instance = null;

    constructor() {
        if (DebugManager.instance) {
            return DebugManager.instance;
        }

        this.logs = [];
        this.maxLogs = 1000;
        this.startTime = Date.now();
        this.performanceMarks = new Map();

        DebugManager.instance = this;
    }

    static getInstance() {
        if (!DebugManager.instance) {
            DebugManager.instance = new DebugManager();
        }
        return DebugManager.instance;
    }

    // Enhanced logging with categories and timestamps
    log(category, message, data = null) {
        const timestamp = Date.now();
        const relativeTime = timestamp - this.startTime;

        const logEntry = {
            timestamp,
            relativeTime,
            category,
            message,
            data,
            level: 'info'
        };

        this.addLog(logEntry);
        console.log(`[${relativeTime}ms] [${category}] ${message}`, data || '');
    }

    // Error logging
    error(category, message, error = null) {
        const timestamp = Date.now();
        const relativeTime = timestamp - this.startTime;

        const logEntry = {
            timestamp,
            relativeTime,
            category,
            message,
            data: error ? {
                name: error.name,
                message: error.message,
                stack: error.stack
            } : null,
            level: 'error'
        };

        this.addLog(logEntry);
        console.error(`[${relativeTime}ms] [${category}] ERROR: ${message}`, error || '');
    }

    // Warning logging
    warn(category, message, data = null) {
        const timestamp = Date.now();
        const relativeTime = timestamp - this.startTime;

        const logEntry = {
            timestamp,
            relativeTime,
            category,
            message,
            data,
            level: 'warn'
        };

        this.addLog(logEntry);
        console.warn(`[${relativeTime}ms] [${category}] WARNING: ${message}`, data || '');
    }

    // Performance marking
    mark(name) {
        const timestamp = Date.now();
        this.performanceMarks.set(name, timestamp);
        this.log('Performance', `Mark: ${name}`);
    }

    // Performance measurement
    measure(name, startMark) {
        const endTime = Date.now();
        const startTime = this.performanceMarks.get(startMark);

        if (startTime) {
            const duration = endTime - startTime;
            this.log('Performance', `Measure: ${name} took ${duration}ms`);
            return duration;
        } else {
            this.warn('Performance', `Start mark '${startMark}' not found for measurement '${name}'`);
            return null;
        }
    }

    // Add log entry with size management
    addLog(logEntry) {
        this.logs.push(logEntry);

        // Keep only the most recent logs
        if (this.logs.length > this.maxLogs) {
            this.logs = this.logs.slice(-this.maxLogs);
        }
    }

    // Get logs by category
    getLogsByCategory(category) {
        return this.logs.filter(log => log.category === category);
    }

    // Get logs by level
    getLogsByLevel(level) {
        return this.logs.filter(log => log.level === level);
    }

    // Export logs for debugging
    exportLogs() {
        const exportData = {
            timestamp: new Date().toISOString(),
            sessionDuration: Date.now() - this.startTime,
            logs: this.logs,
            performanceMarks: Array.from(this.performanceMarks.entries())
        };

        return JSON.stringify(exportData, null, 2);
    }

    // Clear logs
    clearLogs() {
        this.logs = [];
        this.performanceMarks.clear();
        this.log('Debug', 'Logs cleared');
    }

    // Get debug statistics
    getStats() {
        const stats = {
            totalLogs: this.logs.length,
            errorCount: this.logs.filter(log => log.level === 'error').length,
            warningCount: this.logs.filter(log => log.level === 'warn').length,
            sessionDuration: Date.now() - this.startTime,
            categories: [...new Set(this.logs.map(log => log.category))],
            performanceMarks: this.performanceMarks.size
        };

        return stats;
    }
}
