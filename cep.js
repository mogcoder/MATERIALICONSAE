import { ErrorRecoveryManager } from './errorRecovery.js';
import { showMessage } from './ui.js';

// Initialize CSInterface with retry mechanism
export async function initializeCSInterface() {
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
            const csInterface = new CSInterface();
            console.log('CSInterface instance created');

            // Comprehensive functionality tests
            const tests = [
                {
                    name: 'getHostEnvironment',
                    test: () => typeof csInterface.getHostEnvironment === 'function'
                },
                {
                    name: 'evalScript',
                    test: () => typeof csInterface.evalScript === 'function'
                },
                {
                    name: 'addEventListener',
                    test: () => typeof csInterface.addEventListener === 'function'
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

                csInterface.evalScript('"CSInterface_Test_Success"', (result) => {
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
                const hostEnv = csInterface.getHostEnvironment();
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
            return csInterface; // Return the instance
        },
        {
            maxRetries: 9, // Total 10 attempts (1 initial + 9 retries)
            baseDelay: 500,
            maxDelay: 5000,
            backoffMultiplier: 1.5,
            shouldRetry: (error, attempt) => {
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

// Load JSX host script for After Effects integration
export async function loadJSXHostScript(csInterface) {
    const errorRecovery = ErrorRecoveryManager.getInstance();

    return await errorRecovery.executeWithRetry(
        'JSX_HostScript_Load',
        async (attempt) => {
            console.log(`JSX host script load attempt ${attempt}`);

            const extensionPath = csInterface.getSystemPath(SystemPath.EXTENSION);
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
                csInterface.evalScript(loadScript, (result) => {
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

// Read local file using ExtendScript
export async function readLocalFile(csInterface, filePath, maxRetries = 3) {
    console.log(`Starting enhanced file read for: ${filePath}`);
    const errorRecovery = ErrorRecoveryManager.getInstance();

    // Normalize and validate file path
    const normalizedPath = normalizePath(csInterface, filePath);
    console.log(`Normalized path: ${normalizedPath}`);

    return await errorRecovery.executeWithRetry(
        `FileRead_${normalizedPath}`,
        async (attempt) => {
            console.log(`File read attempt ${attempt}`);

            const result = await attemptFileRead(csInterface, normalizedPath, attempt);

            if (result && result.success) {
                console.log(`File read successful on attempt ${attempt}`);
                console.log(`Content length: ${result.content.length} characters`);
                return result.content;
            } else {
                throw new Error(result.error || 'Unknown file read error');
            }
        },
        {
            maxRetries: maxRetries - 1,
            baseDelay: 1000,
            maxDelay: 5000,
            backoffMultiplier: 2,
            shouldRetry: (error, attempt) => {
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

// Add icon to After Effects using JSX host script
export async function addIconToAfterEffects(csInterface, icon, settings) {
    if (!csInterface) {
        console.log('Icon clicked in browser mode', { iconName: icon.name, mode: 'browser' });
        alert(`Icon: ${icon.name}\nUnicode: ${icon.unicode}\nFont: Material Symbols ${settings.fontFamily}`);
        return;
    }

    const errorRecovery = ErrorRecoveryManager.getInstance();

    try {
        await errorRecovery.executeWithRetry(
            `AddIcon_${icon.name}`,
            async (attempt) => {
                const iconChar = String.fromCharCode(parseInt(icon.unicode, 16));
                const fontName = `Material Symbols ${settings.fontFamily}`;

                const script = `addIconToTimelineJSON("${iconChar}", "${fontName}", 100, ${settings.fill}, ${settings.weight}, ${settings.grade}, ${settings.opticalSize})`;

                return new Promise((resolve, reject) => {
                    csInterface.evalScript(script, (result) => {
                        console.log('Icon addition result:', result);

                        if (!result || result.trim() === '' || result === 'null' || result === 'undefined') {
                            reject(new Error('Empty or null result from JSX script'));
                            return;
                        }

                        try {
                            const parsedResult = JSON.parse(result);
                            if (parsedResult.success) {
                                console.log(`Icon added successfully: ${icon.name}`);
                                resolve(parsedResult);
                            } else {
                                reject(new Error(parsedResult.message || 'Unknown error from JSX script'));
                            }
                        } catch (e) {
                            console.error('Error parsing JSON result:', e, 'Raw result:', result);
                            if (typeof result === 'string' && (result.includes('success') || result.includes('SUCCESS'))) {
                                resolve({ success: true, message: result });
                            } else {
                                reject(new Error(result || 'Unexpected response from After Effects'));
                            }
                        }
                    });
                });
            },
            {
                maxRetries: 2,
                baseDelay: 500,
                maxDelay: 2000,
                backoffMultiplier: 1.5,
                shouldRetry: (error, attempt) => {
                    return !error.message.includes('composition') &&
                           !error.message.includes('project') &&
                           !error.message.includes('timeline');
                },
                onRetry: async (error, attempt, delay) => {
                    console.log(`Icon addition retry ${attempt} in ${delay}ms due to: ${error.message}`);
                }
            }
        );
        showMessage(`تم إضافة الأيقونة "${icon.name}" بنجاح إلى التايمل اين`, 'success');
    } catch (error) {
        console.error('Failed to add icon after all attempts:', error);
        if (error.message.includes('Empty or null result')) {
            showMessage('خطأ: لم يتم الحصول على استجابة من After Effects. تأكد من وجود composition نشط.', 'error');
        } else if (error.message.includes('composition') || error.message.includes('project')) {
            showMessage('خطأ: تأكد من وجود مشروع و composition نشط في After Effects.', 'error');
        } else {
            showMessage(`خطأ في إضافة الأيقونة: ${error.message}`, 'error');
        }
    }
}


// --- Helper Functions (not exported) ---

function normalizePath(csInterface, filePath) {
    if (!filePath) {
        throw new Error('File path is required');
    }
    let normalized = filePath.replace(/\//g, '\\');
    if (!isAbsolutePath(normalized)) {
        console.warn('Relative path detected, converting to absolute');
        const extensionPath = csInterface ? csInterface.getSystemPath(SystemPath.EXTENSION) : '';
        normalized = extensionPath + '\\' + normalized;
    }
    return normalized.replace(/\\+/g, '\\');
}

function isAbsolutePath(path) {
    return /^[A-Za-z]:\\/.test(path) || /^\\\\/.test(path);
}

async function attemptFileRead(csInterface, filePath, attemptNumber) {
    return new Promise((resolve, reject) => {
        const timeoutMs = 10000;
        let timeoutId = setTimeout(() => {
            console.error(`File read timeout after ${timeoutMs}ms`);
            reject(new Error(`File read operation timed out after ${timeoutMs}ms`));
        }, timeoutMs);

        const script = `
            (function() {
                try {
                    // ... (The full script from the original file)
                    var startTime = new Date().getTime();
                    var filePath = "${filePath.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}";
                    var file = new File(filePath);
                    if (!file.exists) {
                        return JSON.stringify({ success: false, error: "File does not exist: " + filePath });
                    }
                    try {
                        var testOpen = file.open('r');
                        if (!testOpen) {
                            return JSON.stringify({ success: false, error: "Cannot open file for reading: " + filePath });
                        }
                        file.close();
                    } catch (permError) {
                        return JSON.stringify({ success: false, error: "File permission error: " + permError.toString() });
                    }
                    file.open('r');
                    var content = file.read();
                    file.close();
                    var endTime = new Date().getTime();
                    var duration = endTime - startTime;
                    if (content === null || content === undefined) {
                        return JSON.stringify({ success: false, error: "File content is null or undefined" });
                    }
                    return JSON.stringify({ success: true, content: content });
                } catch (e) {
                    return JSON.stringify({ success: false, error: "ExtendScript error: " + e.toString() });
                }
            })();
        `;

        csInterface.evalScript(script, (result) => {
            clearTimeout(timeoutId);
            try {
                if (!result || result === 'null' || result === 'undefined') {
                    reject(new Error('ExtendScript returned null or undefined result'));
                    return;
                }
                const parsedResult = JSON.parse(result);
                resolve(parsedResult);
            } catch (parseError) {
                console.error('Failed to parse ExtendScript result:', parseError);
                reject(new Error(`Failed to parse ExtendScript result: ${parseError.message}. Raw result: ${result}`));
            }
        });
    });
}
