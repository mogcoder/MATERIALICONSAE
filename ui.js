// Loading and UI State Manager
export class LoadingManager {
    static instance = null;

    constructor() {
        if (LoadingManager.instance) {
            return LoadingManager.instance;
        }

        this.loadingOverlay = null;
        this.errorOverlay = null;
        this.messageToast = null;
        this.progressBar = null;
        this.loadingText = null;

        this.initializeElements();
        LoadingManager.instance = this;
    }

    static getInstance() {
        if (!LoadingManager.instance) {
            LoadingManager.instance = new LoadingManager();
        }
        return LoadingManager.instance;
    }

    initializeElements() {
        // Get DOM elements
        this.loadingOverlay = document.getElementById('loadingOverlay');
        this.errorOverlay = document.getElementById('errorOverlay');
        this.messageToast = document.getElementById('messageToast');
        this.progressBar = document.getElementById('progressBar');
        this.loadingText = document.getElementById('loadingText');

        // Setup event listeners
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Retry button
        const retryButton = document.getElementById('retryButton');
        if (retryButton) {
            retryButton.addEventListener('click', () => {
                this.hideError();
                this.showLoading('Retrying initialization...');
                // Trigger retry logic
                setTimeout(() => {
                    window.location.reload();
                }, 500);
            });
        }

        // Fallback button
        const fallbackButton = document.getElementById('fallbackButton');
        if (fallbackButton) {
            fallbackButton.addEventListener('click', () => {
                this.hideError();
                this.showLoading('Loading basic mode...');
                // Continue with basic functionality
                this.hideLoading();
                this.showToast('Running in basic mode', 'warning');
            });
        }

        // Toast close button
        const toastClose = document.getElementById('toastClose');
        if (toastClose) {
            toastClose.addEventListener('click', () => {
                this.hideToast();
            });
        }
    }

    showLoading(text = 'Loading...', progress = 0) {
        if (this.loadingOverlay) {
            this.loadingOverlay.style.display = 'flex';
        }

        if (this.loadingText) {
            this.loadingText.textContent = text;
        }

        this.updateProgress(progress);
    }

    hideLoading() {
        if (this.loadingOverlay) {
            this.loadingOverlay.style.display = 'none';
        }
    }

    updateProgress(percentage) {
        if (this.progressBar) {
            this.progressBar.style.width = `${Math.max(0, Math.min(100, percentage))}%`;
        }
    }

    updateLoadingText(text) {
        if (this.loadingText) {
            this.loadingText.textContent = text;
        }
    }

    showError(title = 'Error', message = 'An error occurred', canRetry = true) {
        this.hideLoading();

        if (this.errorOverlay) {
            this.errorOverlay.style.display = 'flex';

            const errorTitle = document.getElementById('errorTitle');
            const errorMessage = document.getElementById('errorMessage');
            const retryButton = document.getElementById('retryButton');

            if (errorTitle) errorTitle.textContent = title;
            if (errorMessage) errorMessage.textContent = message;
            if (retryButton) retryButton.style.display = canRetry ? 'block' : 'none';
        }
    }

    hideError() {
        if (this.errorOverlay) {
            this.errorOverlay.style.display = 'none';
        }
    }

    showToast(message, type = 'success', duration = 4000) {
        if (!this.messageToast) return;

        const toastIcon = document.getElementById('toastIcon');
        const toastMessage = document.getElementById('toastMessage');

        // Set icon based on type
        const icons = {
            success: '✓',
            error: '✗',
            warning: '⚠',
            info: 'ℹ'
        };

        if (toastIcon) {
            toastIcon.textContent = icons[type] || icons.info;
        }

        if (toastMessage) {
            toastMessage.textContent = message;
        }

        // Update toast class for styling
        this.messageToast.className = `message-toast toast-${type}`;
        this.messageToast.style.display = 'block';

        // Auto-hide after duration
        if (duration > 0) {
            setTimeout(() => {
                this.hideToast();
            }, duration);
        }
    }

    hideToast() {
        if (this.messageToast) {
            this.messageToast.style.display = 'none';
        }
    }

    setIconsGridLoading(loading = true) {
        const iconsGrid = document.getElementById('iconsGrid');
        if (iconsGrid) {
            if (loading) {
                iconsGrid.classList.add('loading');
            } else {
                iconsGrid.classList.remove('loading');
            }
        }
    }
}

// Show message to user
export function showMessage(message, type = 'info') {
    // Create or get message container
    let messageContainer = document.getElementById('messageContainer');
    if (!messageContainer) {
        messageContainer = document.createElement('div');
        messageContainer.id = 'messageContainer';
        messageContainer.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            z-index: 1000;
            max-width: 300px;
        `;
        document.body.appendChild(messageContainer);
    }

    // Create message element
    const messageElement = document.createElement('div');
    messageElement.style.cssText = `
        padding: 10px 15px;
        margin-bottom: 10px;
        border-radius: 4px;
        color: white;
        font-size: 14px;
        opacity: 0;
        transition: opacity 0.3s ease;
        background-color: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : '#2196F3'};
    `;
    messageElement.textContent = message;

    messageContainer.appendChild(messageElement);

    // Animate in
    setTimeout(() => {
        messageElement.style.opacity = '1';
    }, 10);

    // Remove after 5 seconds
    setTimeout(() => {
        messageElement.style.opacity = '0';
        setTimeout(() => {
            if (messageElement.parentNode) {
                messageElement.parentNode.removeChild(messageElement);
            }
        }, 300);
    }, 5000);
}
