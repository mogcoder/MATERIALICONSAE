// Enhanced DOM loading mechanism with MutationObserver
export class DOMManager {
    static instance = null;

    constructor() {
        this.isInitialized = false;
        this.initializationPromise = null;
        this.requiredElements = [
            'categoryFilter', 'fontFamily', 'fontStyle', 'fontFill',
            'fontGrad', 'fontOpsz', 'searchInput', 'iconsGrid'
        ];
    }

    static getInstance() {
        if (!DOMManager.instance) {
            DOMManager.instance = new DOMManager();
        }
        return DOMManager.instance;
    }

    async waitForDOM() {
        if (this.isInitialized) {
            return Promise.resolve();
        }

        if (this.initializationPromise) {
            return this.initializationPromise;
        }

        this.initializationPromise = new Promise((resolve, reject) => {
            console.log('Starting enhanced DOM loading process...');

            const checkElements = () => {
                const missingElements = this.requiredElements.filter(id => !document.getElementById(id));

                if (missingElements.length === 0) {
                    console.log('All required DOM elements are available');
                    this.isInitialized = true;
                    resolve();
                    return true;
                }

                console.log('Missing DOM elements:', missingElements);
                return false;
            };

            // Check immediately if DOM is already ready
            if (document.readyState === 'complete' || document.readyState === 'interactive') {
                if (checkElements()) return;
            }

            // Set up multiple fallback mechanisms
            let resolved = false;
            const timeout = setTimeout(() => {
                if (!resolved) {
                    console.warn('DOM loading timeout reached, proceeding anyway...');
                    resolved = true;
                    this.isInitialized = true;
                    resolve();
                }
            }, 10000); // 10 second timeout

            // DOMContentLoaded event
            const onDOMContentLoaded = () => {
                console.log('DOMContentLoaded event fired');
                setTimeout(() => {
                    if (!resolved && checkElements()) {
                        resolved = true;
                        clearTimeout(timeout);
                        resolve();
                    }
                }, 100);
            };

            // Window load event as fallback
            const onWindowLoad = () => {
                console.log('Window load event fired');
                setTimeout(() => {
                    if (!resolved && checkElements()) {
                        resolved = true;
                        clearTimeout(timeout);
                        resolve();
                    }
                }, 200);
            };

            // MutationObserver to watch for DOM changes
            const observer = new MutationObserver((mutations) => {
                if (resolved) return;

                let hasRelevantChanges = false;
                mutations.forEach(mutation => {
                    if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                        hasRelevantChanges = true;
                    }
                });

                if (hasRelevantChanges && checkElements()) {
                    resolved = true;
                    clearTimeout(timeout);
                    observer.disconnect();
                    resolve();
                }
            });

            // Start observing
            observer.observe(document.body || document.documentElement, {
                childList: true,
                subtree: true
            });

            // Add event listeners
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', onDOMContentLoaded, { once: true });
            } else {
                onDOMContentLoaded();
            }

            window.addEventListener('load', onWindowLoad, { once: true });

            // Periodic check as additional fallback
            const intervalCheck = setInterval(() => {
                if (resolved) {
                    clearInterval(intervalCheck);
                    return;
                }

                if (checkElements()) {
                    resolved = true;
                    clearTimeout(timeout);
                    clearInterval(intervalCheck);
                    observer.disconnect();
                    resolve();
                }
            }, 500);
        });

        return this.initializationPromise;
    }
}
