// Error Recovery and Retry Manager
export class ErrorRecoveryManager {
    static instance = null;

    constructor() {
        if (ErrorRecoveryManager.instance) {
            return ErrorRecoveryManager.instance;
        }

        this.retryAttempts = new Map(); // Track retry attempts for different operations
        this.maxRetries = 3;
        this.baseDelay = 1000; // Base delay in milliseconds
        this.maxDelay = 10000; // Maximum delay
        this.backoffMultiplier = 2;

        ErrorRecoveryManager.instance = this;
    }

    static getInstance() {
        if (!ErrorRecoveryManager.instance) {
            ErrorRecoveryManager.instance = new ErrorRecoveryManager();
        }
        return ErrorRecoveryManager.instance;
    }

    // Execute operation with automatic retry logic
    async executeWithRetry(operationName, operation, options = {}) {
        const {
            maxRetries = this.maxRetries,
            baseDelay = this.baseDelay,
            backoffMultiplier = this.backoffMultiplier,
            maxDelay = this.maxDelay,
            onRetry = null,
            shouldRetry = null
        } = options;

        let lastError;

        for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
            try {
                console.log(`${operationName}: Attempt ${attempt}/${maxRetries + 1}`);

                const result = await operation(attempt);

                // Reset retry count on success
                this.retryAttempts.delete(operationName);

                console.log(`${operationName}: Success on attempt ${attempt}`);
                return result;

            } catch (error) {
                lastError = error;
                console.error(`${operationName}: Failed on attempt ${attempt}:`, error);

                // Check if we should retry this error
                if (shouldRetry && !shouldRetry(error, attempt)) {
                    console.log(`${operationName}: Error not retryable, stopping`);
                    break;
                }

                // Don't retry on the last attempt
                if (attempt > maxRetries) {
                    console.log(`${operationName}: Max retries exceeded`);
                    break;
                }

                // Calculate delay with exponential backoff
                const delay = Math.min(
                    baseDelay * Math.pow(backoffMultiplier, attempt - 1),
                    maxDelay
                );

                console.log(`${operationName}: Retrying in ${delay}ms...`);

                // Call retry callback if provided
                if (onRetry) {
                    try {
                        await onRetry(error, attempt, delay);
                    } catch (callbackError) {
                        console.error(`${operationName}: Retry callback failed:`, callbackError);
                    }
                }

                // Wait before retry
                await this.delay(delay);
            }
        }

        // Track failed operation
        this.retryAttempts.set(operationName, (this.retryAttempts.get(operationName) || 0) + 1);

        throw new Error(`${operationName} failed after ${maxRetries + 1} attempts. Last error: ${lastError.message}`);
    }

    // Execute operation with circuit breaker pattern
    async executeWithCircuitBreaker(operationName, operation, options = {}) {
        const {
            failureThreshold = 5,
            resetTimeout = 30000, // 30 seconds
            monitoringPeriod = 60000 // 1 minute
        } = options;

        const circuitKey = `circuit_${operationName}`;
        const circuit = this.getCircuitState(circuitKey);

        // Check if circuit is open
        if (circuit.state === 'open') {
            if (Date.now() - circuit.lastFailureTime < resetTimeout) {
                throw new Error(`Circuit breaker is open for ${operationName}. Try again later.`);
            } else {
                // Try to reset circuit
                circuit.state = 'half-open';
                console.log(`${operationName}: Circuit breaker moving to half-open state`);
            }
        }

        try {
            const result = await operation();

            // Success - reset circuit
            circuit.state = 'closed';
            circuit.failureCount = 0;
            circuit.lastSuccessTime = Date.now();

            console.log(`${operationName}: Circuit breaker reset to closed state`);
            return result;

        } catch (error) {
            circuit.failureCount++;
            circuit.lastFailureTime = Date.now();

            // Check if we should open the circuit
            if (circuit.failureCount >= failureThreshold) {
                circuit.state = 'open';
                console.log(`${operationName}: Circuit breaker opened due to ${circuit.failureCount} failures`);
            }

            throw error;
        }
    }

    // Get or create circuit state
    getCircuitState(circuitKey) {
        if (!this.retryAttempts.has(circuitKey)) {
            this.retryAttempts.set(circuitKey, {
                state: 'closed', // closed, open, half-open
                failureCount: 0,
                lastFailureTime: 0,
                lastSuccessTime: Date.now()
            });
        }
        return this.retryAttempts.get(circuitKey);
    }

    // Utility function for delays
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Check if error is retryable
    isRetryableError(error) {
        const retryableErrors = [
            'network',
            'timeout',
            'connection',
            'temporary',
            'busy',
            'unavailable'
        ];

        const errorMessage = error.message.toLowerCase();
        return retryableErrors.some(keyword => errorMessage.includes(keyword));
    }

    // Get retry statistics
    getRetryStats() {
        const stats = {};
        for (const [operation, attempts] of this.retryAttempts.entries()) {
            if (typeof attempts === 'number') {
                stats[operation] = { totalRetries: attempts };
            } else {
                stats[operation] = attempts;
            }
        }
        return stats;
    }

    // Reset retry statistics
    resetStats() {
        this.retryAttempts.clear();
    }
}
