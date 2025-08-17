import { DebugManager } from './debug.js';
import { ErrorRecoveryManager } from './errorRecovery.js';
import { DOMManager } from './dom.js';
import { LoadingManager } from './ui.js';
import { initializeCSInterface, loadJSXHostScript } from './cep.js';
import { IconManager } from './icons.js';

class MaterialIconsPanel {
    constructor() {
        this.csInterface = null;
        this.currentFontFamily = 'Outlined';
        this.currentFontStyle = '400';
        this.currentFontFill = '0';
        this.currentFontGrad = '0';
        this.currentFontOpsz = '48';
        this.searchQuery = '';
        this.selectedCategory = 'All';
        this.viewSize = 'medium';
        this.hideNames = false;

        this.debugManager = DebugManager.getInstance();
        this.errorRecovery = ErrorRecoveryManager.getInstance();
        this.loadingManager = LoadingManager.getInstance();
        this.iconManager = new IconManager(this);

        this.debugMode = this.getDebugMode();
        if (this.debugMode) {
            this.debugManager.log('MaterialIconsPanel', 'Constructor initialized with debug mode enabled');
        }

        this.initializeAsync();
    }

    getDebugMode() {
        try {
            const urlParams = new URLSearchParams(window.location.search);
            if (urlParams.get('debug') === 'true') {
                localStorage.setItem('materialicons_debug', 'true');
                return true;
            }
            return localStorage.getItem('materialicons_debug') === 'true';
        } catch (error) {
            return false;
        }
    }

    async initializeAsync() {
        try {
            await this.errorRecovery.executeWithRetry('Panel_Initialize', async (attempt) => {
                this.loadingManager.showLoading(`Initializing... (Attempt ${attempt})`, 10);

                this.loadingManager.updateLoadingText('Connecting to Adobe CEP...');
                this.csInterface = await initializeCSInterface();
                this.debugManager.log('initialization', 'CSInterface initialization completed');

                this.loadingManager.updateLoadingText('Loading icon data...');
                await this.init();
                this.debugManager.log('initialization', 'Panel initialization completed');

                return true;
            }, { /* retry options */ });

            setTimeout(() => {
                this.loadingManager.hideLoading();
                this.loadingManager.showToast('Panel loaded successfully!', 'success');
            }, 500);

        } catch (error) {
            console.error('Initialization failed after all retries:', error);
            this.loadingManager.showError('Initialization Failed', `Failed to initialize: ${error.message}`, true);
            // Setup manual retry
            const retryBtn = document.querySelector('.error-retry-btn');
            if (retryBtn) {
                retryBtn.onclick = () => {
                    this.loadingManager.hideError();
                    this.errorRecovery.resetStats();
                    this.initializeAsync();
                };
            }
        }
    }

    async init() {
        if (this.csInterface) {
            await loadJSXHostScript(this.csInterface);
            await this.iconManager.loadIcons(this.csInterface, this.currentFontFamily);
        } else {
            this.iconManager.iconObjects = this.iconManager.getBasicIcons();
        }

        this.populateCategories();
        this.setupEventListeners();
        this.iconManager.renderIcons();
    }

    populateCategories() {
        const categorySelect = document.getElementById('categoryFilter');
        if (!categorySelect) return;
        const categories = [...new Set(this.iconManager.iconObjects.map(icon => icon.category))].sort();
        categorySelect.innerHTML = '<option value="All">All Categories</option>';
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            categorySelect.appendChild(option);
        });
    }

    setupEventListeners(retryCount = 0) {
        const elementsToFind = [
            'categoryFilter', 'fontFamily', 'fontStyle', 'fontFill',
            'fontGrad', 'fontOpsz', 'searchInput', 'clearSearch',
            'resetFilters', 'hideNames'
        ];

        const elements = {};
        let allFound = true;
        for (const id of elementsToFind) {
            elements[id] = document.getElementById(id);
            if (!elements[id]) {
                console.warn(`${id} element not found!`);
                allFound = false;
            }
        }

        if (!allFound && retryCount < 3) {
            console.warn(`Critical elements missing, retrying in ${(retryCount + 1) * 100}ms...`);
            setTimeout(() => this.setupEventListeners(retryCount + 1), (retryCount + 1) * 100);
            return;
        }

        elements.categoryFilter?.addEventListener('change', (e) => {
            this.selectedCategory = e.target.value;
            this.iconManager.renderIcons();
        });

        elements.fontFamily?.addEventListener('change', (e) => {
            this.currentFontFamily = e.target.value;
            this.updateIcons();
        });

        elements.fontStyle?.addEventListener('change', (e) => {
            this.currentFontStyle = e.target.value;
            this.iconManager.renderIcons();
        });

        elements.fontFill?.addEventListener('change', (e) => {
            this.currentFontFill = e.target.value;
            this.iconManager.renderIcons();
        });

        elements.fontGrad?.addEventListener('change', (e) => {
            this.currentFontGrad = e.target.value;
            this.iconManager.renderIcons();
        });

        elements.fontOpsz?.addEventListener('change', (e) => {
            this.currentFontOpsz = e.target.value;
            this.iconManager.renderIcons();
        });

        const debouncedSearch = this.debounce((query) => {
            this.searchQuery = query;
            this.iconManager.clearFilterCache();
            this.iconManager.renderIcons();
        }, 300);

        elements.searchInput?.addEventListener('input', (e) => {
            debouncedSearch(e.target.value.toLowerCase().trim());
        });

        elements.clearSearch?.addEventListener('click', () => this.clearSearch());
        elements.resetFilters?.addEventListener('click', () => this.resetAllFilters());

        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.changeViewSize(e.target.dataset.size);
            });
        });

        elements.hideNames?.addEventListener('change', (e) => {
            this.hideNames = e.target.checked;
            document.getElementById('iconsGrid')?.classList.toggle('hide-names', this.hideNames);
        });
    }

    clearSearch() {
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.value = '';
            this.searchQuery = '';
            this.iconManager.renderIcons();
        }
    }

    changeViewSize(size) {
        this.viewSize = size;
        document.querySelectorAll('.view-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelector(`[data-size="${size}"]`)?.classList.add('active');
        const iconsGrid = document.getElementById('iconsGrid');
        if (iconsGrid) {
            iconsGrid.classList.remove('small', 'medium', 'large');
            iconsGrid.classList.add(size);
        }
    }

    resetAllFilters() {
        this.selectedCategory = 'All';
        this.currentFontFamily = 'Outlined';
        this.currentFontStyle = '400';
        this.currentFontFill = '0';
        this.currentFontGrad = '0';
        this.currentFontOpsz = '48';
        this.searchQuery = '';
        this.viewSize = 'medium';
        this.hideNames = false;

        document.getElementById('categoryFilter').value = this.selectedCategory;
        document.getElementById('fontFamily').value = this.currentFontFamily;
        document.getElementById('fontStyle').value = this.currentFontStyle;
        document.getElementById('fontFill').value = this.currentFontFill;
        document.getElementById('fontGrad').value = this.currentFontGrad;
        document.getElementById('fontOpsz').value = this.currentFontOpsz;
        document.getElementById('searchInput').value = '';
        document.getElementById('hideNames').checked = false;

        this.changeViewSize('medium');

        this.iconManager.renderIcons();
    }

    debounce(func, delay = 300) {
        let timeoutId;
        return (...args) => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => func.apply(this, args), delay);
        };
    }

    updateIcons() {
        this.iconManager.clearFilterCache();
        this.iconManager.cleanup();
        if (this.csInterface) {
            this.loadingManager.setIconsGridLoading(true);
            this.iconManager.loadIcons(this.csInterface, this.currentFontFamily).then(() => {
                this.iconManager.clearFilterCache();
                this.iconManager.renderIcons();
                this.loadingManager.setIconsGridLoading(false);
            });
        } else {
            this.iconManager.renderIcons();
        }
    }
}

export async function initializeApplication() {
    try {
        if (typeof CSInterface === 'undefined') {
            console.error('CSInterface not available');
            // Do not throw error here, allow fallback for browser mode
        }
        const domManager = DOMManager.getInstance();
        await domManager.waitForDOM();
        new MaterialIconsPanel();
    } catch (error) {
        console.error('Failed to initialize application:', error);
        // Show error message to user
    }
}
