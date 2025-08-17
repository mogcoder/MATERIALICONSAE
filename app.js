// Material Icons Panel - CEP Compatible Version
console.log('Loading Material Icons Panel...');

class MaterialIconsPanel {
    constructor() {
        console.log('Creating MaterialIconsPanel instance...');
        this.csInterface = null;
        this.icons = [];
        this.iconObjects = [];
        this.filteredIcons = [];
        this.currentFontFamily = 'Outlined'; // Default font family
        this.currentFontStyle = '400'; // Default font style (weight)
        this.currentFontFill = '0'; // Default fill value
        this.currentFontGrad = '0'; // Default grade value
        this.currentFontOpsz = '48'; // Default optical size value
        this.searchQuery = ''; // Search query
        this.selectedCategory = 'All'; // Selected category
        this.viewSize = 'medium'; // View size
        this.hideNames = false; // Hide icon names
        
        // Debug mode configuration
        this.debugMode = this.getDebugMode();
        this.debugManager = DebugManager.getInstance();
        
        if (this.debugMode) {
            this.debugManager.log('MaterialIconsPanel', 'Constructor initialized with debug mode enabled');
        }
        
        // Initialize CSInterface and then init the panel
        this.initializeAsync();
    }
    
    // Get debug mode from URL parameters or localStorage
    getDebugMode() {
        try {
            // Check URL parameters
            const urlParams = new URLSearchParams(window.location.search);
            if (urlParams.get('debug') === 'true') {
                localStorage.setItem('materialicons_debug', 'true');
                return true;
            }
            
            // Check localStorage
            return localStorage.getItem('materialicons_debug') === 'true';
        } catch (error) {
            return false;
        }
    }
    
    // Async initialization wrapper
    async initializeAsync() {
        const loadingManager = LoadingManager.getInstance();
        const errorRecovery = ErrorRecoveryManager.getInstance();
        
        try {
            // Execute initialization with automatic retry
            await errorRecovery.executeWithRetry(
                'MaterialIconsPanel_Initialize',
                async (attempt) => {
                    this.debugManager.log('initialization', `Starting async initialization... (Attempt ${attempt})`);
                    loadingManager.showLoading(`Initializing Material Icons Panel... (Attempt ${attempt})`, 10);
                    
                    // Initialize CSInterface with enhanced error handling
                    loadingManager.updateLoadingText('Connecting to Adobe CEP...');
                    loadingManager.updateProgress(30);
                    this.debugManager.mark('csinterface_init_start');
                    await this.initializeCSInterface();
                    this.debugManager.measure('csinterface_init_duration', 'csinterface_init_start');
                    this.debugManager.log('initialization', 'CSInterface initialization completed');
                    
                    // Initialize the panel
                    loadingManager.updateLoadingText('Loading icon data...');
                    loadingManager.updateProgress(60);
                    this.debugManager.mark('panel_init_start');
                    await this.init();
                    this.debugManager.measure('panel_init_duration', 'panel_init_start');
                    this.debugManager.log('initialization', 'Panel initialization completed');
                    
                    loadingManager.updateLoadingText('Finalizing setup...');
                    loadingManager.updateProgress(100);
                    
                    return true;
                },
                {
                    maxRetries: 2,
                    baseDelay: 2000,
                    shouldRetry: (error, attempt) => {
                        // Retry on CSInterface or connectivity errors
                        return error.message.includes('CSInterface') ||
                               error.message.includes('not available') ||
                               error.message.includes('connectivity') ||
                               errorRecovery.isRetryableError(error);
                    },
                    onRetry: async (error, attempt, delay) => {
                        loadingManager.updateLoadingText(`Retrying in ${Math.ceil(delay/1000)} seconds...`);
                        loadingManager.showToast(
                            `Attempt ${attempt} failed. Retrying...`, 
                            'warning', 
                            delay
                        );
                    }
                }
            );
            
            // Hide loading and show success
            setTimeout(() => {
                loadingManager.hideLoading();
                loadingManager.showToast('Material Icons Panel loaded successfully!', 'success');
            }, 500);
            
        } catch (error) {
            console.error('Initialization failed after all retries:', error);
            
            // Show error with retry option
            loadingManager.showError(
                'Initialization Failed',
                `Failed to initialize after multiple attempts: ${error.message}`,
                true
            );
            
            // Set up manual retry mechanism
            const retryBtn = document.querySelector('.error-retry-btn');
            if (retryBtn) {
                retryBtn.onclick = () => {
                    loadingManager.hideError();
                    // Reset retry statistics before manual retry
                    errorRecovery.resetStats();
                    this.initializeAsync();
                };
            }
            
            // Fallback: continue with basic functionality
            console.log('Falling back to basic mode...');
            this.csInterface = null;
            
            try {
                await this.init();
                console.log('Basic mode initialization completed');
                loadingManager.hideError();
                loadingManager.showToast('Running in basic mode - some features may be limited', 'warning', 6000);
            } catch (initError) {
                console.error('Even basic initialization failed:', initError);
                loadingManager.showError(
                    'Critical Error',
                    'Failed to initialize Material Icons Panel. Please refresh the panel.',
                    true
                );
            }
        }
    }
    
    // Initialize CSInterface with retry mechanism
    // Enhanced CSInterface initialization with comprehensive error handling
    async initializeCSInterface() {
        console.log('Starting enhanced CSInterface initialization...');
        const errorRecovery = ErrorRecoveryManager.getInstance();
        
        return await errorRecovery.executeWithRetry(
            'CSInterface_Initialize',
            async (attempt) => {
                console.log(`CSInterface initialization attempt ${attempt}`);
                
                // Check if CSInterface is available
                if (typeof CSInterface === 'undefined') {
                    throw new Error('CSInterface class not available');
                }
                
                // Create CSInterface instance
                this.csInterface = new CSInterface();
                console.log('CSInterface instance created');
                
                // Comprehensive functionality tests
                const tests = [
                    {
                        name: 'getHostEnvironment',
                        test: () => typeof this.csInterface.getHostEnvironment === 'function'
                    },
                    {
                        name: 'evalScript',
                        test: () => typeof this.csInterface.evalScript === 'function'
                    },
                    {
                        name: 'addEventListener',
                        test: () => typeof this.csInterface.addEventListener === 'function'
                    }
                ];
                
                const failedTests = tests.filter(test => !test.test());
                
                if (failedTests.length > 0) {
                    throw new Error(`CSInterface missing methods: ${failedTests.map(t => t.name).join(', ')}`);
                }
                
                // Test actual functionality with a simple script
                await new Promise((testResolve, testReject) => {
                    const testTimeout = setTimeout(() => {
                        testReject(new Error('CSInterface test timeout'));
                    }, 3000);
                    
                    this.csInterface.evalScript('"CSInterface_Test_Success"', (result) => {
                        clearTimeout(testTimeout);
                        if (result === 'CSInterface_Test_Success') {
                            console.log('CSInterface functionality test passed');
                            testResolve();
                        } else {
                            testReject(new Error(`CSInterface test failed: ${result}`));
                        }
                    });
                });
                
                // Get host environment info for additional validation
                try {
                    const hostEnv = this.csInterface.getHostEnvironment();
                    if (hostEnv) {
                        const envData = JSON.parse(hostEnv);
                        console.log('Host environment:', {
                            appName: envData.appName,
                            appVersion: envData.appVersion,
                            appLocale: envData.appLocale
                        });
                    }
                } catch (envError) {
                    console.warn('Could not get host environment info:', envError);
                }
                
                console.log('CSInterface initialized and tested successfully');
                return true;
            },
            {
                maxRetries: 9, // Total 10 attempts (1 initial + 9 retries)
                baseDelay: 500,
                maxDelay: 5000,
                backoffMultiplier: 1.5,
                shouldRetry: (error, attempt) => {
                    // Reset CSInterface on failure
                    this.csInterface = null;
                    
                    // Retry on most errors except permanent ones
                    return !error.message.includes('permanently') &&
                           !error.message.includes('unsupported');
                },
                onRetry: async (error, attempt, delay) => {
                    console.log(`CSInterface retry ${attempt} in ${delay}ms due to: ${error.message}`);
                }
            }
        );
    }

    async init() {
        this.debugManager.log('initialization', 'Initializing MaterialIconsPanel...', {
            documentReadyState: document.readyState,
            csInterfaceAvailable: typeof CSInterface !== 'undefined',
            csInterfaceInstance: !!this.csInterface
        });
        
        // Check if CSInterface is available
        if (typeof CSInterface !== 'undefined' && this.csInterface) {
            this.debugManager.log('initialization', 'CSInterface available, loading JSX host script...');
            try {
                this.debugManager.mark('jsx_load_start');
                await this.loadJSXHostScript();
                this.debugManager.measure('jsx_load_duration', 'jsx_load_start');
                this.debugManager.log('initialization', 'JSX host script loaded successfully');
            } catch (error) {
                this.debugManager.warn('initialization', 'Failed to load JSX host script', { error: error.message });
                this.debugManager.log('initialization', 'Continuing without JSX integration...');
            }
            
            this.debugManager.log('initialization', 'Attempting to load codepoints files...');
            this.debugManager.mark('codepoints_load_start');
            await this.loadLocalCodepoints();
            this.debugManager.measure('codepoints_load_duration', 'codepoints_load_start');
        } else {
            this.debugManager.log('initialization', 'CSInterface not available, using basic icon list...');
            this.icons = this.getBasicIcons();
        }
        
        // Create icon objects with categories
        this.iconObjects = this.icons.map(icon => ({
            name: typeof icon === 'string' ? icon : icon.name,
            unicode: typeof icon === 'string' ? this.getIconUnicode(icon) : icon.unicode,
            category: this.categorizeIcon(typeof icon === 'string' ? icon : icon.name)
        }));
        
        this.populateCategories();
        
        // Check if DOM is ready
        if (document.readyState === 'loading') {
            this.debugManager.log('initialization', 'DOM still loading, waiting...');
            document.addEventListener('DOMContentLoaded', () => {
                this.debugManager.log('initialization', 'DOM loaded, setting up event listeners...');
                this.setupEventListeners();
            });
        } else {
            this.debugManager.log('initialization', 'DOM already loaded, setting up event listeners immediately...');
            this.setupEventListeners();
        }
        
        // Add a small delay to ensure fonts are loaded
        setTimeout(() => {
            this.debugManager.mark('initial_render_start');
            this.renderIcons();
            this.debugManager.measure('initial_render_duration', 'initial_render_start');
        }, 100);
        
        console.log('MaterialIconsPanel initialization complete');
    }

    // Categorize icon based on its name
    categorizeIcon(iconName) {
        const name = iconName.toLowerCase();
        
        // Navigation icons
        if (name.includes('arrow') || name.includes('navigate') || name.includes('chevron') || 
            name.includes('expand') || name.includes('keyboard') || name.includes('first_page') ||
            name.includes('last_page') || name.includes('menu') || name.includes('more')) {
            return 'Navigation';
        }
        
        // Media icons
        if (name.includes('play') || name.includes('pause') || name.includes('stop') || 
            name.includes('volume') || name.includes('music') || name.includes('video') ||
            name.includes('camera') || name.includes('mic') || name.includes('record') ||
            name.includes('movie') || name.includes('audio')) {
            return 'Media';
        }
        
        // Communication icons
        if (name.includes('email') || name.includes('mail') || name.includes('call') || 
            name.includes('phone') || name.includes('message') || name.includes('chat') ||
            name.includes('contact') || name.includes('person') || name.includes('people') ||
            name.includes('group') || name.includes('share')) {
            return 'Communication';
        }
        
        // Actions icons
        if (name.includes('add') || name.includes('edit') || name.includes('delete') || 
            name.includes('remove') || name.includes('create') || name.includes('save') ||
            name.includes('copy') || name.includes('cut') || name.includes('paste') ||
            name.includes('undo') || name.includes('redo') || name.includes('refresh') ||
            name.includes('sync') || name.includes('update')) {
            return 'Actions';
        }
        
        // Files icons
        if (name.includes('file') || name.includes('folder') || name.includes('document') || 
            name.includes('cloud') || name.includes('download') || name.includes('upload') ||
            name.includes('attach') || name.includes('storage') || name.includes('drive')) {
            return 'Files';
        }
        
        // Settings icons
        if (name.includes('settings') || name.includes('config') || name.includes('gear') || 
            name.includes('tune') || name.includes('adjust') || name.includes('control') ||
            name.includes('admin') || name.includes('manage')) {
            return 'Settings';
        }
        
        // Home & Places icons
        if (name.includes('home') || name.includes('house') || name.includes('place') || 
            name.includes('location') || name.includes('map') || name.includes('room') ||
            name.includes('building') || name.includes('store') || name.includes('business')) {
            return 'Places';
        }
        
        // Device icons
        if (name.includes('phone') || name.includes('tablet') || name.includes('computer') || 
            name.includes('laptop') || name.includes('desktop') || name.includes('device') ||
            name.includes('mobile') || name.includes('watch') || name.includes('tv')) {
            return 'Device';
        }
        
        // Default category
        return 'General';
    }

    // Populate category dropdown
    populateCategories() {
        const categorySelect = document.getElementById('categoryFilter');
        if (!categorySelect) return;
        
        const categories = [...new Set(this.iconObjects.map(icon => icon.category))].sort();
        
        // Clear existing options except "All Categories"
        categorySelect.innerHTML = '<option value="All">All Categories</option>';
        
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            categorySelect.appendChild(option);
        });
    }

    // Setup event listeners for dropdown controls
    setupEventListeners(retryCount = 0) {
        console.log(`Setting up event listeners (attempt ${retryCount + 1})...`);
        
        const categoryFilter = document.getElementById('categoryFilter');
        const fontFamilySelector = document.getElementById('fontFamily');
        const fontStyleSelector = document.getElementById('fontStyle');
        const fontFillSelector = document.getElementById('fontFill');
        const fontGradSelector = document.getElementById('fontGrad');
        const fontOpszSelector = document.getElementById('fontOpsz');
        const searchInput = document.getElementById('searchInput');
        const clearSearchBtn = document.getElementById('clearSearch');
        const resetButton = document.getElementById('resetFilters');
        const hideNamesCheckbox = document.getElementById('hideNames');
        
        // Debug: Check if elements exist
        const elementsFound = {
            categoryFilter: !!categoryFilter,
            fontFamilySelector: !!fontFamilySelector,
            fontStyleSelector: !!fontStyleSelector,
            fontFillSelector: !!fontFillSelector,
            fontGradSelector: !!fontGradSelector,
            fontOpszSelector: !!fontOpszSelector,
            searchInput: !!searchInput,
            clearSearchBtn: !!clearSearchBtn,
            resetButton: !!resetButton,
            hideNamesCheckbox: !!hideNamesCheckbox
        };
        
        console.log('Elements found:', elementsFound);
        
        // Check if critical elements are missing
        const criticalElements = [fontFamilySelector, fontStyleSelector, fontFillSelector, fontGradSelector, fontOpszSelector];
        const missingCritical = criticalElements.some(el => !el);
        
        if (missingCritical && retryCount < 3) {
            console.warn(`Critical elements missing, retrying in ${(retryCount + 1) * 100}ms...`);
            setTimeout(() => this.setupEventListeners(retryCount + 1), (retryCount + 1) * 100);
            return;
        }
        
        // Category filter
        if (categoryFilter) {
            console.log('Adding event listener to categoryFilter');
            categoryFilter.addEventListener('change', (e) => {
                this.selectedCategory = e.target.value;
                console.log('Category changed to:', this.selectedCategory);
                this.renderIcons();
            });
        } else {
            console.warn('categoryFilter element not found!');
        }
        
        if (fontFamilySelector) {
            console.log('Adding event listener to fontFamilySelector');
            fontFamilySelector.addEventListener('change', (e) => {
                this.currentFontFamily = e.target.value;
                console.log('Font family changed to:', this.currentFontFamily);
                this.updateIcons();
            });
        } else {
            console.warn('fontFamilySelector element not found!');
        }
        
        if (fontStyleSelector) {
            console.log('Adding event listener to fontStyleSelector');
            fontStyleSelector.addEventListener('change', (e) => {
                this.currentFontStyle = e.target.value;
                console.log('Font style changed to:', this.currentFontStyle);
                this.renderIcons();
            });
        } else {
            console.warn('fontStyleSelector element not found!');
        }
        
        if (fontFillSelector) {
            console.log('Adding event listener to fontFillSelector');
            fontFillSelector.addEventListener('change', (e) => {
                this.currentFontFill = e.target.value;
                console.log('Fill changed to:', this.currentFontFill);
                this.renderIcons();
            });
        } else {
            console.warn('fontFillSelector element not found!');
        }
        
        if (fontGradSelector) {
            console.log('Adding event listener to fontGradSelector');
            fontGradSelector.addEventListener('change', (e) => {
                this.currentFontGrad = e.target.value;
                console.log('Grade changed to:', this.currentFontGrad);
                this.renderIcons();
            });
        } else {
            console.warn('fontGradSelector element not found!');
        }
        
        if (fontOpszSelector) {
            console.log('Adding event listener to fontOpszSelector');
            fontOpszSelector.addEventListener('change', (e) => {
                this.currentFontOpsz = e.target.value;
                console.log('Optical size changed to:', this.currentFontOpsz);
                this.renderIcons();
            });
        } else {
            console.warn('fontOpszSelector element not found!');
        }
        
        if (searchInput) {
            // Create debounced search function
            const debouncedSearch = this.debounceSearch((query) => {
                this.searchQuery = query;
                console.log('Search query changed to:', this.searchQuery);
                this.clearFilterCache(); // Clear cache when search changes
                this.renderIcons();
            }, 300);
            
            searchInput.addEventListener('input', (e) => {
                const query = e.target.value.toLowerCase().trim();
                debouncedSearch(query);
            });
        }
        
        if (clearSearchBtn) {
            clearSearchBtn.addEventListener('click', () => {
                this.clearSearch();
            });
        }
        
        // View size controls
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.changeViewSize(e.target.dataset.size);
            });
        });
        
        if (hideNamesCheckbox) {
            hideNamesCheckbox.addEventListener('change', (e) => {
                this.hideNames = e.target.checked;
                const iconsGrid = document.getElementById('iconsGrid');
                if (iconsGrid) {
                    iconsGrid.classList.toggle('hide-names', this.hideNames);
                }
            });
        }
        
        if (resetButton) {
            resetButton.addEventListener('click', () => {
                this.resetAllFilters();
            });
        }
    }
    
    // Clear search input
    clearSearch() {
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.value = '';
            this.searchQuery = '';
            this.renderIcons();
        }
    }
    
    // Change view size
    changeViewSize(size) {
        this.viewSize = size;
        document.querySelectorAll('.view-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelector(`[data-size="${size}"]`).classList.add('active');
        
        const iconsGrid = document.getElementById('iconsGrid');
        if (iconsGrid) {
            iconsGrid.classList.remove('small', 'medium', 'large');
            iconsGrid.classList.add(size);
        }
    }
    
    // Reset all filters to default values
    resetAllFilters() {
        // Reset all properties to default values
        this.selectedCategory = 'All';
        this.currentFontFamily = 'Outlined';
        this.currentFontStyle = '400';
        this.currentFontFill = '0';
        this.currentFontGrad = '0';
        this.currentFontOpsz = '48';
        this.searchQuery = '';
        this.viewSize = 'medium';
        this.hideNames = false;
        
        // Update UI elements
        const categoryFilter = document.getElementById('categoryFilter');
        const fontFamilySelector = document.getElementById('fontFamily');
        const fontStyleSelector = document.getElementById('fontStyle');
        const fontFillSelector = document.getElementById('fontFill');
        const fontGradSelector = document.getElementById('fontGrad');
        const fontOpszSelector = document.getElementById('fontOpsz');
        const searchInput = document.getElementById('searchInput');
        const hideNamesCheckbox = document.getElementById('hideNames');
        
        if (categoryFilter) categoryFilter.value = this.selectedCategory;
        if (fontFamilySelector) fontFamilySelector.value = this.currentFontFamily;
        if (fontStyleSelector) fontStyleSelector.value = this.currentFontStyle;
        if (fontFillSelector) fontFillSelector.value = this.currentFontFill;
        if (fontGradSelector) fontGradSelector.value = this.currentFontGrad;
        if (fontOpszSelector) fontOpszSelector.value = this.currentFontOpsz;
        if (searchInput) searchInput.value = '';
        if (hideNamesCheckbox) hideNamesCheckbox.checked = false;
        
        // Reset view size
        document.querySelectorAll('.view-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelector('[data-size="medium"]').classList.add('active');
        
        const iconsGrid = document.getElementById('iconsGrid');
        if (iconsGrid) {
            iconsGrid.classList.remove('small', 'medium', 'large', 'hide-names');
            iconsGrid.classList.add('medium');
        }
        
        console.log('All filters reset to default values');
        this.renderIcons();
    }
    
    // Load JSX host script for After Effects integration
    async loadJSXHostScript() {
        const errorRecovery = ErrorRecoveryManager.getInstance();
        
        return await errorRecovery.executeWithRetry(
            'JSX_HostScript_Load',
            async (attempt) => {
                console.log(`JSX host script load attempt ${attempt}`);
                
                const extensionPath = this.csInterface.getSystemPath(SystemPath.EXTENSION);
                const jsxPath = extensionPath + '/jsx/hostscript.jsx';
                
                console.log('Loading JSX host script from:', jsxPath);
                
                // Load the JSX file
                const loadScript = `
                    try {
                        var jsxFile = new File("${jsxPath.replace(/\\/g, '\\\\')}");
                        if (jsxFile.exists) {
                            $.evalFile(jsxFile);
                            "JSX_LOADED_SUCCESS";
                        } else {
                            "JSX_FILE_NOT_FOUND";
                        }
                    } catch (e) {
                        "JSX_LOAD_ERROR: " + e.toString();
                    }
                `;
                
                return new Promise((resolve, reject) => {
                    this.csInterface.evalScript(loadScript, (result) => {
                        console.log('JSX load result:', result);
                        if (result === 'JSX_LOADED_SUCCESS') {
                            console.log('JSX host script loaded successfully');
                            resolve(true);
                        } else {
                            console.error('Failed to load JSX script:', result);
                            reject(new Error('Failed to load JSX script: ' + result));
                        }
                    });
                });
            },
            {
                maxRetries: 2, // Total 3 attempts
                baseDelay: 1000,
                maxDelay: 3000,
                backoffMultiplier: 1.5,
                shouldRetry: (error, attempt) => {
                    // Retry on most errors except file not found
                    return !error.message.includes('JSX_FILE_NOT_FOUND');
                },
                onRetry: async (error, attempt, delay) => {
                    console.log(`JSX load retry ${attempt} in ${delay}ms due to: ${error.message}`);
                }
            }
        );
    }

    // Helper function to update icons when font style changes
    updateIcons() {
        const loadingManager = LoadingManager.getInstance();
        
        // Clear filter cache and cleanup previous renders
        this.clearFilterCache();
        this.cleanup();
        
        // Reload icons with new font style
        if (typeof CSInterface !== 'undefined' && this.csInterface) {
            loadingManager.setIconsGridLoading(true);
            this.loadLocalCodepoints().then(() => {
                this.clearFilterCache(); // Clear cache again after loading new data
                this.renderIcons();
                loadingManager.setIconsGridLoading(false);
            }).catch((error) => {
                console.error('Error updating icons:', error);
                loadingManager.setIconsGridLoading(false);
                loadingManager.showToast('Failed to update icons', 'error');
            });
        } else {
            // If CSInterface is not available, just re-render basic icons
            this.renderIcons();
        }
    }

    // Load local .codepoints files
    async loadLocalCodepoints() {
        const loadingManager = LoadingManager.getInstance();
        
        try {
            loadingManager.setIconsGridLoading(true);
            loadingManager.updateLoadingText('Loading icon definitions...');
            
            // Read local codepoints file using CSInterface
            const extensionPath = this.csInterface.getSystemPath(SystemPath.EXTENSION);
            let codepointsPath;
            if (this.currentFontFamily === 'Outlined') {
                codepointsPath = extensionPath + '/src/MaterialSymbolsOutlined[FILL,GRAD,opsz,wght].codepoints';
            } else if (this.currentFontFamily === 'Rounded') {
                codepointsPath = extensionPath + '/src/MaterialSymbolsRounded[FILL,GRAD,opsz,wght].codepoints';
            } else if (this.currentFontFamily === 'Sharp') {
                codepointsPath = extensionPath + '/src/MaterialSymbolsSharp[FILL,GRAD,opsz,wght].codepoints';
            } else {
                codepointsPath = extensionPath + '/src/MaterialSymbolsOutlined[FILL,GRAD,opsz,wght].codepoints';
            }
            
            // Read file using evalScript
            this.debugManager.log('codepoints', 'Attempting to read file', { path: codepointsPath, fontFamily: this.currentFontFamily });
            loadingManager.updateLoadingText('Reading icon definitions...');
            
            this.debugManager.mark('file_read_start');
            const response = await this.readLocalFile(codepointsPath);
            this.debugManager.measure('file_read_duration', 'file_read_start');
            
            if (response) {
                loadingManager.updateLoadingText('Parsing icon data...');
                this.debugManager.mark('parse_start');
                this.icons = this.parseCodepoints(response);
                this.debugManager.measure('parse_duration', 'parse_start');
                this.debugManager.log('codepoints', 'Successfully loaded icons', { count: this.icons.length, fontFamily: this.currentFontFamily });
                loadingManager.showToast(`Loaded ${this.icons.length} icons successfully`, 'success', 3000);
            } else {
                throw new Error('Codepoints file not found');
            }
        } catch (error) {
            this.debugManager.error('codepoints', 'Error loading icons', error);
            console.log('Using basic icon list');
            this.icons = this.getBasicIcons();
            loadingManager.showToast('Using basic icon set - some icons may be missing', 'warning', 5000);
        } finally {
            loadingManager.setIconsGridLoading(false);
        }
    }

    // Read local file using ExtendScript
    // Enhanced file reading with comprehensive error handling and retry mechanism
    async readLocalFile(filePath, maxRetries = 3) {
        console.log(`Starting enhanced file read for: ${filePath}`);
        const errorRecovery = ErrorRecoveryManager.getInstance();
        
        // Normalize and validate file path
        const normalizedPath = this.normalizePath(filePath);
        console.log(`Normalized path: ${normalizedPath}`);
        
        return await errorRecovery.executeWithRetry(
            `FileRead_${normalizedPath}`,
            async (attempt) => {
                console.log(`File read attempt ${attempt}`);
                
                const result = await this.attemptFileRead(normalizedPath, attempt);
                
                if (result && result.success) {
                    console.log(`File read successful on attempt ${attempt}`);
                    console.log(`Content length: ${result.content.length} characters`);
                    return result.content;
                } else {
                    throw new Error(result.error || 'Unknown file read error');
                }
            },
            {
                maxRetries: maxRetries - 1, // Total attempts = 1 initial + (maxRetries - 1) retries
                baseDelay: 1000,
                maxDelay: 5000,
                backoffMultiplier: 2,
                shouldRetry: (error, attempt) => {
                    // Retry on most file system errors except permanent ones
                    return !error.message.includes('not found') ||
                           !error.message.includes('permission denied') ||
                           !error.message.includes('access denied');
                },
                onRetry: async (error, attempt, delay) => {
                    console.log(`File read retry ${attempt} in ${delay}ms due to: ${error.message}`);
                }
            }
        );
    }
    
    // Normalize file path for cross-platform compatibility
    normalizePath(filePath) {
        if (!filePath) {
            throw new Error('File path is required');
        }
        
        // Convert forward slashes to backslashes for Windows
        let normalized = filePath.replace(/\//g, '\\');
        
        // Ensure absolute path
        if (!this.isAbsolutePath(normalized)) {
            console.warn('Relative path detected, converting to absolute');
            const extensionPath = this.csInterface ? this.csInterface.getSystemPath(SystemPath.EXTENSION) : '';
            normalized = extensionPath + '\\' + normalized;
        }
        
        // Remove duplicate backslashes
        normalized = normalized.replace(/\\+/g, '\\');
        
        console.log(`Path normalization: ${filePath} -> ${normalized}`);
        return normalized;
    }
    
    // Check if path is absolute
    isAbsolutePath(path) {
        // Windows: C:\\ or \\\\server\\share
        return /^[A-Za-z]:\\/.test(path) || /^\\\\/.test(path);
    }
    
    // Attempt to read file with detailed error reporting
    async attemptFileRead(filePath, attemptNumber) {
        return new Promise((resolve, reject) => {
            const timeoutMs = 10000; // 10 second timeout
            let timeoutId;
            
            // Enhanced ExtendScript with better error handling
            const script = `
                (function() {
                    try {
                        var startTime = new Date().getTime();
                        var filePath = "${filePath.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}";
                        
                        // Create file object
                        var file = new File(filePath);
                        
                        // Check if file exists
                        if (!file.exists) {
                            return JSON.stringify({
                                success: false,
                                error: "File does not exist: " + filePath,
                                details: {
                                    path: filePath,
                                    exists: false,
                                    attempt: ${attemptNumber}
                                }
                            });
                        }
                        
                        // Check file permissions
                        try {
                            var testOpen = file.open('r');
                            if (!testOpen) {
                                return JSON.stringify({
                                    success: false,
                                    error: "Cannot open file for reading: " + filePath,
                                    details: {
                                        path: filePath,
                                        exists: true,
                                        readable: false,
                                        attempt: ${attemptNumber}
                                    }
                                });
                            }
                            file.close();
                        } catch (permError) {
                            return JSON.stringify({
                                success: false,
                                error: "File permission error: " + permError.toString(),
                                details: {
                                    path: filePath,
                                    exists: true,
                                    permissionError: permError.toString(),
                                    attempt: ${attemptNumber}
                                }
                            });
                        }
                        
                        // Read file content
                        file.open('r');
                        var content = file.read();
                        file.close();
                        
                        var endTime = new Date().getTime();
                        var duration = endTime - startTime;
                        
                        // Validate content
                        if (content === null || content === undefined) {
                            return JSON.stringify({
                                success: false,
                                error: "File content is null or undefined",
                                details: {
                                    path: filePath,
                                    exists: true,
                                    readable: true,
                                    contentNull: true,
                                    duration: duration,
                                    attempt: ${attemptNumber}
                                }
                            });
                        }
                        
                        return JSON.stringify({
                            success: true,
                            content: content,
                            details: {
                                path: filePath,
                                exists: true,
                                readable: true,
                                contentLength: content.length,
                                duration: duration,
                                attempt: ${attemptNumber}
                            }
                        });
                        
                    } catch (e) {
                        return JSON.stringify({
                            success: false,
                            error: "ExtendScript error: " + e.toString(),
                            details: {
                                path: "${filePath.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}",
                                exception: e.toString(),
                                line: e.line || 'unknown',
                                attempt: ${attemptNumber}
                            }
                        });
                    }
                })();
            `;
            
            // Set timeout for the operation
            timeoutId = setTimeout(() => {
                console.error(`File read timeout after ${timeoutMs}ms`);
                reject(new Error(`File read operation timed out after ${timeoutMs}ms`));
            }, timeoutMs);
            
            // Execute script
            this.csInterface.evalScript(script, (result) => {
                clearTimeout(timeoutId);
                
                try {
                    console.log(`ExtendScript result (attempt ${attemptNumber}):`, result);
                    
                    if (!result || result === 'null' || result === 'undefined') {
                        reject(new Error('ExtendScript returned null or undefined result'));
                        return;
                    }
                    
                    // Parse JSON result
                    const parsedResult = JSON.parse(result);
                    console.log(`Parsed result details:`, parsedResult.details);
                    
                    resolve(parsedResult);
                    
                } catch (parseError) {
                    console.error('Failed to parse ExtendScript result:', parseError);
                    reject(new Error(`Failed to parse ExtendScript result: ${parseError.message}. Raw result: ${result}`));
                }
            });
        });
    }

    // Parse codepoints file content
    parseCodepoints(content) {
        console.log('Starting codepoints parsing, content length:', content.length);
        const lines = content.split('\n');
        const icons = [];
        
        for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed && !trimmed.startsWith('#')) {
                const parts = trimmed.split(' ');
                if (parts.length >= 2) {
                    const iconName = parts[0];
                    const category = this.categorizeIcon(iconName);
                    icons.push({
                        name: iconName,
                        unicode: parts[1],
                        category: category
                    });
                }
            }
        }
        
        console.log('Parsed', icons.length, 'icons from', lines.length, 'lines');
        return icons.slice(0, 500); // Limit count for performance
    }

    // Categorize icon based on its name
    categorizeIcon(iconName) {
        const name = iconName.toLowerCase();
        
        // Navigation icons
        if (name.includes('arrow') || name.includes('navigate') || name.includes('keyboard') || 
            name.includes('expand') || name.includes('menu') || name.includes('close') || 
            name.includes('home') || name.includes('back') || name.includes('forward') || 
            name.includes('first') || name.includes('last') || name.includes('more')) {
            return 'Navigation';
        }
        
        // Communication icons
        if (name.includes('mail') || name.includes('email') || name.includes('phone') || 
            name.includes('call') || name.includes('message') || name.includes('chat') || 
            name.includes('contact') || name.includes('business')) {
            return 'Communication';
        }
        
        // Media/AV icons
        if (name.includes('play') || name.includes('pause') || name.includes('stop') || 
            name.includes('volume') || name.includes('music') || name.includes('video') || 
            name.includes('camera') || name.includes('mic') || name.includes('skip') || 
            name.includes('record') || name.includes('audio')) {
            return 'AV';
        }
        
        // File icons
        if (name.includes('folder') || name.includes('file') || name.includes('download') || 
            name.includes('upload') || name.includes('cloud') || name.includes('save') || 
            name.includes('storage') || name.includes('drive')) {
            return 'File';
        }
        
        // Device/Hardware icons
        if (name.includes('phone') || name.includes('computer') || name.includes('laptop') || 
            name.includes('tablet') || name.includes('watch') || name.includes('tv') || 
            name.includes('device') || name.includes('desktop') || name.includes('smartphone') || 
            name.includes('wifi') || name.includes('bluetooth') || name.includes('battery') || 
            name.includes('signal') || name.includes('brightness')) {
            return name.includes('wifi') || name.includes('bluetooth') || name.includes('battery') || name.includes('signal') || name.includes('brightness') ? 'Device' : 'Hardware';
        }
        
        // Social icons
        if (name.includes('people') || name.includes('person') || name.includes('group') || 
            name.includes('account') || name.includes('user') || name.includes('thumb') || 
            name.includes('favorite') || name.includes('heart') || name.includes('share') || 
            name.includes('notification')) {
            return 'Social';
        }
        
        // Content/Editor icons
        if (name.includes('edit') || name.includes('create') || name.includes('copy') || 
            name.includes('cut') || name.includes('paste') || name.includes('undo') || 
            name.includes('redo') || name.includes('content') || name.includes('description') || 
            name.includes('attach') || name.includes('add') || name.includes('remove')) {
            return name.includes('edit') || name.includes('description') || name.includes('attach') ? 'Editor' : 'Content';
        }
        
        // Image icons
        if (name.includes('image') || name.includes('photo') || name.includes('picture') || 
            name.includes('camera') || name.includes('tune')) {
            return 'Image';
        }
        
        // Maps/Location icons
        if (name.includes('location') || name.includes('place') || name.includes('map') || 
            name.includes('drive_eta')) {
            return 'Maps';
        }
        
        // Alert icons
        if (name.includes('warning') || name.includes('error') || name.includes('alert')) {
            return 'Alert';
        }
        
        // Toggle icons
        if (name.includes('star') || name.includes('favorite') || name.includes('toggle') || 
            name.includes('check') || name.includes('radio')) {
            return 'Toggle';
        }
        
        // Notification icons
        if (name.includes('sync') || name.includes('refresh') || name.includes('update') || 
            name.includes('notification')) {
            return 'Notification';
        }
        
        // Default to Action for everything else
        return 'Action';
    }

    // Basic list of common icons
    getBasicIcons() {
        console.log('Using basic icon list');
        return [
            // Home & Navigation
            {name: 'home', unicode: 'e88a', category: 'Navigation'}, {name: 'search', unicode: 'e8b6', category: 'Action'}, {name: 'menu', unicode: 'e5d2', category: 'Navigation'}, {name: 'close', unicode: 'e5cd', category: 'Navigation'},
            // Basic Actions
            {name: 'add', unicode: 'e145', category: 'Content'}, {name: 'remove', unicode: 'e15b', category: 'Content'}, {name: 'edit', unicode: 'e3c9', category: 'Editor'}, {name: 'delete', unicode: 'e872', category: 'Action'},
            // Social & Feedback
            {name: 'favorite', unicode: 'e87d', category: 'Toggle'}, {name: 'star', unicode: 'e838', category: 'Toggle'}, {name: 'heart_broken', unicode: 'e99c', category: 'Social'}, {name: 'thumb_up', unicode: 'e8db', category: 'Social'},
            {name: 'thumb_down', unicode: 'e8dc', category: 'Social'}, {name: 'share', unicode: 'e80d', category: 'Social'}, {name: 'download', unicode: 'f090', category: 'File'}, {name: 'upload', unicode: 'f09b', category: 'File'},
            // Media Controls
            {name: 'play_arrow', unicode: 'e037', category: 'AV'}, {name: 'pause', unicode: 'e034', category: 'AV'}, {name: 'stop', unicode: 'e047', category: 'AV'}, {name: 'skip_next', unicode: 'e044', category: 'AV'},
            {name: 'skip_previous', unicode: 'e045', category: 'AV'}, {name: 'volume_up', unicode: 'e050', category: 'AV'}, {name: 'volume_down', unicode: 'e04d', category: 'AV'}, {name: 'volume_off', unicode: 'e04f', category: 'AV'},
            // System & User
            {name: 'settings', unicode: 'e8b8', category: 'Action'}, {name: 'account_circle', unicode: 'e853', category: 'Social'}, {name: 'notifications', unicode: 'e7f4', category: 'Social'}, {name: 'mail', unicode: 'e0be', category: 'Communication'},
            {name: 'phone', unicode: 'e0cd', category: 'Communication'}, {name: 'location_on', unicode: 'e0c8', category: 'Maps'}, {name: 'calendar_today', unicode: 'e935', category: 'Action'}, {name: 'schedule', unicode: 'e8b5', category: 'Action'},
            // Files & Media
            {name: 'folder', unicode: 'e2c7', category: 'File'}, {name: 'file_copy', unicode: 'e173', category: 'Content'}, {name: 'image', unicode: 'e3f4', category: 'Image'}, {name: 'video_library', unicode: 'e04a', category: 'AV'},
            {name: 'music_note', unicode: 'e405', category: 'AV'}, {name: 'photo_camera', unicode: 'e412', category: 'Image'}, {name: 'videocam', unicode: 'e04b', category: 'AV'}, {name: 'mic', unicode: 'e029', category: 'AV'},
            // Device & Connectivity
            {name: 'wifi', unicode: 'e63e', category: 'Device'}, {name: 'bluetooth', unicode: 'e1a7', category: 'Device'}, {name: 'battery_full', unicode: 'e1a4', category: 'Device'}, {name: 'signal_cellular_4_bar', unicode: 'e1c8', category: 'Device'},
            {name: 'brightness_high', unicode: 'e1ac', category: 'Device'}, {name: 'brightness_low', unicode: 'e1ad', category: 'Device'}, {name: 'lock', unicode: 'e897', category: 'Action'}, {name: 'lock_open', unicode: 'e898', category: 'Action'},
            // Visibility & Info
            {name: 'visibility', unicode: 'e8f4', category: 'Action'}, {name: 'visibility_off', unicode: 'e8f5', category: 'Action'}, {name: 'help', unicode: 'e887', category: 'Action'}, {name: 'info', unicode: 'e88e', category: 'Action'},
            // Status & Alerts
            {name: 'warning', unicode: 'e002', category: 'Alert'}, {name: 'error', unicode: 'e000', category: 'Alert'}, {name: 'check', unicode: 'e5ca', category: 'Action'}, {name: 'check_circle', unicode: 'e86c', category: 'Action'},
            // Navigation Arrows
            {name: 'cancel', unicode: 'e5c9', category: 'Navigation'}, {name: 'arrow_back', unicode: 'e5c4', category: 'Navigation'}, {name: 'arrow_forward', unicode: 'e5c8', category: 'Navigation'}, {name: 'arrow_upward', unicode: 'e5d8', category: 'Navigation'},
            {name: 'arrow_downward', unicode: 'e5db', category: 'Navigation'}, {name: 'refresh', unicode: 'e5d5', category: 'Action'}, {name: 'sync', unicode: 'e627', category: 'Notification'}, {name: 'cloud', unicode: 'e2bd', category: 'File'},
            // Cloud & File Operations
            {name: 'cloud_download', unicode: 'e2c0', category: 'File'}, {name: 'cloud_upload', unicode: 'e2c3', category: 'File'}, {name: 'save', unicode: 'e161', category: 'Content'}, {name: 'print', unicode: 'e8ad', category: 'Action'},
            // Edit Operations
            {name: 'copy', unicode: 'e14d', category: 'Content'}, {name: 'cut', unicode: 'e14e', category: 'Content'}, {name: 'paste', unicode: 'e14f', category: 'Content'}, {name: 'undo', unicode: 'e166', category: 'Content'},
            {name: 'redo', unicode: 'e15a', category: 'Content'}, {name: 'zoom_in', unicode: 'e8ff', category: 'Action'}, {name: 'zoom_out', unicode: 'e900', category: 'Action'}, {name: 'fullscreen', unicode: 'e5d0', category: 'Action'},
            // Additional navigation icons
            {name: 'navigate_next', unicode: 'e5c8', category: 'Navigation'}, {name: 'navigate_before', unicode: 'e5c4', category: 'Navigation'}, {name: 'expand_more', unicode: 'e5cf', category: 'Navigation'}, {name: 'expand_less', unicode: 'e5ce', category: 'Navigation'},
            {name: 'keyboard_arrow_up', unicode: 'e316', category: 'Navigation'}, {name: 'keyboard_arrow_down', unicode: 'e313', category: 'Navigation'}, {name: 'keyboard_arrow_left', unicode: 'e314', category: 'Navigation'}, {name: 'keyboard_arrow_right', unicode: 'e315', category: 'Navigation'},
            {name: 'first_page', unicode: 'e5dc', category: 'Navigation'}, {name: 'last_page', unicode: 'e5dd', category: 'Navigation'}, {name: 'more_vert', unicode: 'e5d4', category: 'Navigation'}, {name: 'more_horiz', unicode: 'e5d3', category: 'Navigation'},
            // Additional communication icons
            {name: 'email', unicode: 'e0be', category: 'Communication'}, {name: 'call', unicode: 'e0b0', category: 'Communication'}, {name: 'message', unicode: 'e0c9', category: 'Communication'}, {name: 'chat', unicode: 'e0b7', category: 'Communication'}, {name: 'contact_page', unicode: 'f22e', category: 'Communication'},
            {name: 'people', unicode: 'e7fb', category: 'Social'}, {name: 'group', unicode: 'e7ef', category: 'Social'}, {name: 'person_add', unicode: 'ea4d', category: 'Social'},
            // Additional action icons
            {name: 'create', unicode: 'e150', category: 'Content'}, {name: 'save_alt', unicode: 'e171', category: 'Content'}, {name: 'content_copy', unicode: 'e14d', category: 'Content'}, {name: 'content_cut', unicode: 'e14e', category: 'Content'},
            {name: 'content_paste', unicode: 'e14f', category: 'Content'}, {name: 'update', unicode: 'e923', category: 'Action'},
            // Additional file icons
            {name: 'description', unicode: 'e873', category: 'Editor'}, {name: 'folder_open', unicode: 'e2c8', category: 'File'}, {name: 'attach_file', unicode: 'e226', category: 'Editor'},
            {name: 'storage', unicode: 'e1db', category: 'Device'}, {name: 'drive_eta', unicode: 'e613', category: 'Maps'},
            // Additional settings icons
            {name: 'tune', unicode: 'e429', category: 'Image'}, {name: 'build', unicode: 'e869', category: 'Action'}, {name: 'admin_panel_settings', unicode: 'ef3d', category: 'Action'}, {name: 'manage_accounts', unicode: 'f02e', category: 'Action'},
            // Additional places icons
            {name: 'place', unicode: 'e55f', category: 'Maps'}, {name: 'room', unicode: 'e8b4', category: 'Action'}, {name: 'business', unicode: 'e0af', category: 'Communication'}, {name: 'store', unicode: 'e8d1', category: 'Action'},
            // Additional device icons
            {name: 'smartphone', unicode: 'e32c', category: 'Hardware'}, {name: 'tablet', unicode: 'e32f', category: 'Hardware'}, {name: 'computer', unicode: 'e30a', category: 'Hardware'}, {name: 'laptop', unicode: 'e32d', category: 'Hardware'},
            {name: 'desktop_windows', unicode: 'e30b', category: 'Hardware'}, {name: 'devices', unicode: 'e1b9', category: 'Hardware'}, {name: 'watch', unicode: 'e334', category: 'Hardware'}, {name: 'tv', unicode: 'e333', category: 'Hardware'}
        ];
    }

    // Filter icons based on current settings
    filterIcons() {
        // Create cache key for current filter state
        const cacheKey = `${this.selectedCategory || 'All'}_${this.searchQuery || ''}`;
        
        // Check if we have cached results
        if (this.filterCache && this.filterCache.key === cacheKey) {
            console.log(`Using cached filter results: ${this.filterCache.results.length} icons`);
            return this.filterCache.results;
        }
        
        let filteredIcons = this.iconObjects;
        
        // Apply category filtering first (more selective)
        if (this.selectedCategory && this.selectedCategory !== 'All') {
            filteredIcons = filteredIcons.filter(icon => icon.category === this.selectedCategory);
        }
        
        // Apply text search filtering with optimized search
        if (this.searchQuery && this.searchQuery.length > 0) {
            const searchLower = this.searchQuery.toLowerCase();
            
            // Use more efficient search for short queries
            if (searchLower.length <= 2) {
                filteredIcons = filteredIcons.filter(icon => 
                    icon.name.toLowerCase().startsWith(searchLower)
                );
            } else {
                // Full search for longer queries
                filteredIcons = filteredIcons.filter(icon => {
                    const iconNameLower = icon.name.toLowerCase();
                    return iconNameLower.includes(searchLower) ||
                           iconNameLower.replace(/_/g, ' ').includes(searchLower) ||
                           iconNameLower.replace(/_/g, '').includes(searchLower.replace(/\s+/g, ''));
                });
            }
        }
        
        // Cache the results
        this.filterCache = {
            key: cacheKey,
            results: filteredIcons,
            timestamp: Date.now()
        };
        
        console.log(`Filtering applied: ${this.iconObjects.length} -> ${filteredIcons.length} icons (Category: ${this.selectedCategory}, Search: '${this.searchQuery}')`);
        return filteredIcons;
    }
    
    // Clear filter cache when icons are updated
    clearFilterCache() {
        this.filterCache = null;
    }
    
    // Debounced search to improve performance
    debounceSearch(func, delay = 300) {
        let timeoutId;
        return (...args) => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => func.apply(this, args), delay);
        };
    }

    // Render icons in the grid
    renderIcons() {
        this.debugManager.mark('render_start');
        const filteredIcons = this.filterIcons();
        this.debugManager.log('rendering', 'Starting icon rendering', { 
            filteredCount: filteredIcons.length,
            totalIcons: this.icons.length,
            currentCategory: this.currentCategory,
            searchQuery: this.searchQuery
        });
        const iconsGrid = document.getElementById('iconsGrid');
        
        if (!iconsGrid) {
            this.debugManager.error('rendering', 'Icons grid element not found!');
            return;
        }
        
        if (filteredIcons.length === 0) {
            iconsGrid.innerHTML = `
                <div class="empty-state">
                    <span class="material-icons empty-icon">search_off</span>
                    <h3>No Icons Found</h3>
                    <p>No icons match your current search and filter criteria.</p>
                    <p>Try adjusting your search term or selecting a different category.</p>
                </div>
            `;
            return;
        }
        
        // Clear existing content and setup virtual scrolling
        iconsGrid.innerHTML = '';
        
        // Performance optimization: Use virtual scrolling for large datasets
        if (filteredIcons.length > 100) {
            this.debugManager.log('rendering', 'Using virtual scrolling for large dataset');
            this.renderIconsVirtual(filteredIcons, iconsGrid);
        } else {
            this.debugManager.log('rendering', 'Using batch rendering for small dataset');
            this.renderIconsBatch(filteredIcons, iconsGrid);
        }
        
        this.debugManager.measure('render_duration', 'render_start');
        this.debugManager.log('rendering', 'Icon rendering completed', { 
            renderedCount: filteredIcons.length,
            renderMethod: filteredIcons.length > 100 ? 'virtual' : 'batch'
        });
    }
    
    renderIconsVirtual(icons, container) {
        const ITEMS_PER_ROW = 6;
        const ITEM_HEIGHT = 120;
        const BUFFER_SIZE = 20;
        
        let startIndex = 0;
        let endIndex = Math.min(BUFFER_SIZE, icons.length);
        
        const renderBatch = () => {
            const fragment = document.createDocumentFragment();
            
            for (let i = startIndex; i < endIndex; i++) {
                const icon = icons[i];
                const iconElement = this.createIconElement(icon);
                fragment.appendChild(iconElement);
            }
            
            container.appendChild(fragment);
        };
        
        // Initial render
        renderBatch();
        
        // Setup intersection observer for lazy loading
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && endIndex < icons.length) {
                    startIndex = endIndex;
                    endIndex = Math.min(endIndex + BUFFER_SIZE, icons.length);
                    renderBatch();
                }
            });
        }, { threshold: 0.1 });
        
        // Add sentinel element for infinite scroll
        const sentinel = document.createElement('div');
        sentinel.className = 'scroll-sentinel';
        container.appendChild(sentinel);
        observer.observe(sentinel);
        
        // Store observer for cleanup
        this.scrollObserver = observer;
    }
    
    renderIconsBatch(icons, container) {
        const BATCH_SIZE = 20;
        let currentIndex = 0;
        
        const renderNextBatch = () => {
            const fragment = document.createDocumentFragment();
            const endIndex = Math.min(currentIndex + BATCH_SIZE, icons.length);
            
            for (let i = currentIndex; i < endIndex; i++) {
                const icon = icons[i];
                const iconElement = this.createIconElement(icon);
                fragment.appendChild(iconElement);
            }
            
            container.appendChild(fragment);
            currentIndex = endIndex;
            
            // Continue rendering if there are more icons
            if (currentIndex < icons.length) {
                requestAnimationFrame(renderNextBatch);
            }
        };
        
        renderNextBatch();
    }
    
    createIconElement(icon) {
        const iconElement = document.createElement('div');
        iconElement.className = 'icon-item';
        
        // Display the actual icon character with selected settings
        const iconChar = String.fromCharCode(parseInt(icon.unicode, 16));
        
        // Create font family string based on current family
        const fontFamily = `Material Symbols ${this.currentFontFamily}`;
        
        // Apply font-variation-settings with all four axes
        const fontVariationSettings = `'FILL' ${this.currentFontFill}, 'wght' ${this.currentFontStyle}, 'GRAD' ${this.currentFontGrad}, 'opsz' ${this.currentFontOpsz}`;
        
        iconElement.innerHTML = `
            <span class="icon-symbol" style="font-family: '${fontFamily}', 'Material Icons'; font-variation-settings: ${fontVariationSettings};">${iconChar}</span>
            <span class="icon-name">${icon.name}</span>
            <span class="icon-category">${icon.category}</span>
        `;
        iconElement.title = `${icon.name} (${this.currentFontFamily}, wght: ${this.currentFontStyle}, FILL: ${this.currentFontFill}, GRAD: ${this.currentFontGrad}, opsz: ${this.currentFontOpsz})`;
        
        // Add click event to add icon to After Effects
        iconElement.addEventListener('click', () => {
            this.addIconToAfterEffects(icon.name);
        });
        
        return iconElement;
    }
    
    // Cleanup method for performance optimization
    cleanup() {
        if (this.scrollObserver) {
            this.scrollObserver.disconnect();
            this.scrollObserver = null;
        }
    }

    // Add icon to After Effects using JSX host script
    async addIconToAfterEffects(iconName) {
        if (!this.csInterface) {
            this.debugManager.log('icon_add', 'Icon clicked in browser mode', { iconName, mode: 'browser' });
            alert(`Icon: ${iconName}\nUnicode: ${this.getIconUnicode(iconName)}\nFont: Material Symbols ${this.currentFontFamily}`);
            return;
        }
        
        const errorRecovery = ErrorRecoveryManager.getInstance();
        
        try {
            await errorRecovery.executeWithRetry(
                `AddIcon_${iconName}`,
                async (attempt) => {
                    this.debugManager.log('icon_add', 'Adding icon to After Effects', { 
                        iconName, 
                        attempt, 
                        fontFamily: this.currentFontFamily 
                    });
                    
                    const unicode = this.getIconUnicode(iconName);
                    const iconChar = String.fromCharCode(parseInt(unicode, 16));
                    
                    // Create font name based on current family
                    const fontName = `Material Symbols ${this.currentFontFamily}`;
                    
                    this.debugManager.log('icon_add', 'Font settings configured', {
                        fontName,
                        fill: this.currentFontFill,
                        weight: this.currentFontStyle,
                        grade: this.currentFontGrad,
                        opticalSize: this.currentFontOpsz,
                        unicode,
                        iconChar
                    });
                    
                    // Use the JSX host script for better After Effects integration
                    const script = `addIconToTimelineJSON("${iconChar}", "${fontName}", 100, ${this.currentFontFill}, ${this.currentFontStyle}, ${this.currentFontGrad}, ${this.currentFontOpsz})`;
                    
                    return new Promise((resolve, reject) => {
                        this.csInterface.evalScript(script, (result) => {
                            console.log('Icon addition result:', result);
                            
                            // Check if result is empty or null
                            if (!result || result.trim() === '' || result === 'null' || result === 'undefined') {
                                reject(new Error('Empty or null result from JSX script'));
                                return;
                            }
                            
                            try {
                                // Try to parse as JSON
                                const parsedResult = JSON.parse(result);
                                if (parsedResult.success) {
                                    console.log(`Icon added successfully: ${iconName}`);
                                    resolve(parsedResult);
                                } else {
                                    reject(new Error(parsedResult.message || 'Unknown error from JSX script'));
                                }
                            } catch (e) {
                                console.error('Error parsing JSON result:', e, 'Raw result:', result);
                                
                                // If it's not JSON, treat it as a direct message
                                if (typeof result === 'string') {
                                    if (result.includes('success') || result.includes('SUCCESS')) {
                                        resolve({ success: true, message: result });
                                    } else {
                                        reject(new Error(result));
                                    }
                                } else {
                                    reject(new Error('Unexpected response from After Effects'));
                                }
                            }
                        });
                    });
                },
                {
                    maxRetries: 2, // Total 3 attempts
                    baseDelay: 500,
                    maxDelay: 2000,
                    backoffMultiplier: 1.5,
                    shouldRetry: (error, attempt) => {
                        // Retry on most errors except composition-related ones
                        return !error.message.includes('composition') &&
                               !error.message.includes('project') &&
                               !error.message.includes('timeline');
                    },
                    onRetry: async (error, attempt, delay) => {
                        console.log(`Icon addition retry ${attempt} in ${delay}ms due to: ${error.message}`);
                    }
                }
            );
            
            // Success message
            this.showMessage(`تم إضافة الأيقونة "${iconName}" بنجاح إلى التايملاين`, 'success');
            
        } catch (error) {
            console.error('Failed to add icon after all attempts:', error);
            
            // Show appropriate error message
            if (error.message.includes('Empty or null result')) {
                this.showMessage('خطأ: لم يتم الحصول على استجابة من After Effects. تأكد من وجود composition نشط.', 'error');
            } else if (error.message.includes('composition') || error.message.includes('project')) {
                this.showMessage('خطأ: تأكد من وجود مشروع و composition نشط في After Effects.', 'error');
            } else {
                this.showMessage(`خطأ في إضافة الأيقونة: ${error.message}`, 'error');
            }
        }
    }
    
    // Show message to user
    showMessage(message, type = 'info') {
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
    
    // Get Unicode code for icon
    getIconUnicode(iconName) {
        // Search in loaded icons list
        for (const icon of this.icons) {
            if ((typeof icon === 'string' ? icon : icon.name) === iconName) {
                return typeof icon === 'string' ? 'e88a' : icon.unicode;
            }
        }
        return 'e88a'; // Default icon (home)
    }
}

// Enhanced DOM loading mechanism with MutationObserver
class DOMManager {
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

// Loading and UI State Manager
class LoadingManager {
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

// Error Recovery and Retry Manager
class ErrorRecoveryManager {
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

// Debug Manager for enhanced logging and debugging
class DebugManager {
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

// Initialize application with enhanced DOM loading
async function initializeApplication() {
    try {
        console.log('Starting application initialization...');
        
        // Ensure CSInterface is available
        if (typeof CSInterface === 'undefined') {
            console.error('CSInterface not available');
            throw new Error('CSInterface not available');
        }
        console.log('CSInterface is available');
        
        // Wait for DOM to be fully ready
        const domManager = DOMManager.getInstance();
        await domManager.waitForDOM();
        
        console.log('DOM is ready, creating MaterialIconsPanel...');
        new MaterialIconsPanel();
        
    } catch (error) {
        console.error('Failed to initialize application:', error);
        
        // Show error message to user
        setTimeout(() => {
            const errorDiv = document.createElement('div');
            errorDiv.style.cssText = `
                position: fixed; top: 10px; left: 10px; right: 10px;
                background: #ff4444; color: white; padding: 10px;
                border-radius: 4px; z-index: 9999; font-size: 12px;
            `;
            errorDiv.textContent = 'خطأ في تحميل الإضافة. يرجى إعادة تحميل اللوحة.';
            document.body.appendChild(errorDiv);
            
            // Auto-hide after 5 seconds
            setTimeout(() => {
                if (errorDiv.parentNode) {
                    errorDiv.parentNode.removeChild(errorDiv);
                }
            }, 5000);
        }, 1000);
    }
}

// Start initialization
initializeApplication();