import { readLocalFile } from './cep.js';
import { LoadingManager } from './ui.js';
import { addIconToAfterEffects } from './cep.js';

export class IconManager {
    constructor(panelContext) {
        this.panel = panelContext; // Reference to the main panel instance
        this.icons = [];
        this.iconObjects = [];
        this.filterCache = null;
        this.scrollObserver = null;
    }

    async loadIcons(csInterface, fontFamily) {
        const loadingManager = LoadingManager.getInstance();
        try {
            loadingManager.setIconsGridLoading(true);
            const extensionPath = csInterface.getSystemPath(SystemPath.EXTENSION);
            let codepointsPath;
            if (fontFamily === 'Outlined') {
                codepointsPath = extensionPath + '/src/MaterialSymbolsOutlined[FILL,GRAD,opsz,wght].codepoints';
            } else if (fontFamily === 'Rounded') {
                codepointsPath = extensionPath + '/src/MaterialSymbolsRounded[FILL,GRAD,opsz,wght].codepoints';
            } else if (fontFamily === 'Sharp') {
                codepointsPath = extensionPath + '/src/MaterialSymbolsSharp[FILL,GRAD,opsz,wght].codepoints';
            } else {
                codepointsPath = extensionPath + '/src/MaterialSymbolsOutlined[FILL,GRAD,opsz,wght].codepoints';
            }

            const response = await readLocalFile(csInterface, codepointsPath);
            if (response) {
                this.icons = this.parseCodepoints(response);
                loadingManager.showToast(`Loaded ${this.icons.length} icons successfully`, 'success', 3000);
            } else {
                throw new Error('Codepoints file not found');
            }
        } catch (error) {
            console.error('Error loading icons:', error);
            this.icons = this.getBasicIcons();
            loadingManager.showToast('Using basic icon set - some icons may be missing', 'warning', 5000);
        } finally {
            loadingManager.setIconsGridLoading(false);
        }

        this.iconObjects = this.icons.map(icon => ({
            name: typeof icon === 'string' ? icon : icon.name,
            unicode: typeof icon === 'string' ? this.getIconUnicode(icon) : icon.unicode,
            category: this.categorizeIcon(typeof icon === 'string' ? icon : icon.name)
        }));

        return this.iconObjects;
    }

    parseCodepoints(content) {
        const lines = content.split('\n');
        const icons = [];
        for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed && !trimmed.startsWith('#')) {
                const parts = trimmed.split(' ');
                if (parts.length >= 2) {
                    icons.push({
                        name: parts[0],
                        unicode: parts[1]
                    });
                }
            }
        }
        return icons.slice(0, 500); // Limit for performance
    }

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

    filterIcons() {
        const cacheKey = `${this.panel.selectedCategory || 'All'}_${this.panel.searchQuery || ''}`;
        if (this.filterCache && this.filterCache.key === cacheKey) {
            return this.filterCache.results;
        }

        let filtered = this.iconObjects;
        if (this.panel.selectedCategory && this.panel.selectedCategory !== 'All') {
            filtered = filtered.filter(icon => icon.category === this.panel.selectedCategory);
        }
        if (this.panel.searchQuery && this.panel.searchQuery.length > 0) {
            const searchLower = this.panel.searchQuery.toLowerCase();
            filtered = filtered.filter(icon => icon.name.toLowerCase().includes(searchLower));
        }

        this.filterCache = { key: cacheKey, results: filtered, timestamp: Date.now() };
        return filtered;
    }

    clearFilterCache() {
        this.filterCache = null;
    }

    renderIcons() {
        const filteredIcons = this.filterIcons();
        const iconsGrid = document.getElementById('iconsGrid');
        if (!iconsGrid) return;

        if (filteredIcons.length === 0) {
            iconsGrid.innerHTML = `<div class="empty-state"><h3>No Icons Found</h3></div>`;
            return;
        }

        this.cleanup();
        iconsGrid.innerHTML = '';

        if (filteredIcons.length > 100) {
            this.renderIconsVirtual(filteredIcons, iconsGrid);
        } else {
            this.renderIconsBatch(filteredIcons, iconsGrid);
        }
    }

    renderIconsVirtual(icons, container) {
        // ... (virtual rendering logic)
    }

    renderIconsBatch(icons, container) {
        const BATCH_SIZE = 20;
        let currentIndex = 0;
        const renderNextBatch = () => {
            const fragment = document.createDocumentFragment();
            const endIndex = Math.min(currentIndex + BATCH_SIZE, icons.length);
            for (let i = currentIndex; i < endIndex; i++) {
                fragment.appendChild(this.createIconElement(icons[i]));
            }
            container.appendChild(fragment);
            currentIndex = endIndex;
            if (currentIndex < icons.length) {
                requestAnimationFrame(renderNextBatch);
            }
        };
        renderNextBatch();
    }

    createIconElement(icon) {
        const iconElement = document.createElement('div');
        iconElement.className = 'icon-item';
        const iconChar = String.fromCharCode(parseInt(icon.unicode, 16));
        const fontFamily = `Material Symbols ${this.panel.currentFontFamily}`;
        const fontVariationSettings = `'FILL' ${this.panel.currentFontFill}, 'wght' ${this.panel.currentFontStyle}, 'GRAD' ${this.panel.currentFontGrad}, 'opsz' ${this.panel.currentFontOpsz}`;

        iconElement.innerHTML = `
            <span class="icon-symbol" style="font-family: '${fontFamily}', 'Material Icons'; font-variation-settings: ${fontVariationSettings};">${iconChar}</span>
            <span class="icon-name">${icon.name}</span>
            <span class="icon-category">${icon.category}</span>
        `;
        iconElement.title = `${icon.name} (...)`;
        iconElement.addEventListener('click', () => {
            const settings = {
                fontFamily: this.panel.currentFontFamily,
                fill: this.panel.currentFontFill,
                weight: this.panel.currentFontStyle,
                grade: this.panel.currentFontGrad,
                opticalSize: this.panel.currentFontOpsz
            };
            addIconToAfterEffects(this.panel.csInterface, icon, settings);
        });
        return iconElement;
    }

    cleanup() {
        if (this.scrollObserver) {
            this.scrollObserver.disconnect();
            this.scrollObserver = null;
        }
    }

    getIconUnicode(iconName) {
        const icon = this.iconObjects.find(i => i.name === iconName);
        return icon ? icon.unicode : 'e88a'; // Default icon
    }
}
