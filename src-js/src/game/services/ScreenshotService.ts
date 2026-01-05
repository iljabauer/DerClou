export interface ScreenshotResult {
    success: boolean;
    message: string;
    path?: string;
}

declare const nw: any;

let _screenshotPath: string | null = null;
let _headlessMode: boolean = false;

export const ScreenshotService = {
    init(path: string, headless: boolean): void {
        _screenshotPath = path;
        _headlessMode = headless;
    },

    isNwjsEnvironment(): boolean {
        return typeof nw !== 'undefined';
    },

    getScreenshotPathFromArgs(): string | null {
        // Use cached value if available
        if (_screenshotPath) {
            return _screenshotPath;
        }

        if (!this.isNwjsEnvironment()) {
            return null;
        }

        // nw.App.argv
        if (nw.App && nw.App.argv) {
            const argv = nw.App.argv;
            for (const arg of argv) {
                if (arg.startsWith('--screenshot-path=')) {
                    return arg.split('=')[1];
                }
            }
        }
        return null;
    },

    isHeadlessMode(): boolean {
        // Use cached value if available
        if (_headlessMode) {
            return true;
        }

        if (!this.isNwjsEnvironment()) {
            return false;
        }
        return nw.App.argv.includes('--headless');
    },

    exitApp(): void {
        if (this.isNwjsEnvironment()) {
            nw.App.quit();
        }
    },

    saveScreenshot(base64Data: string, preferredFilename?: string): ScreenshotResult {
        if (this.isNwjsEnvironment()) {
            const path = this.getScreenshotPathFromArgs();
            if (!path) {
                console.error('ScreenshotService: Missing --screenshot-path argument');
                return {
                    success: false,
                    message: 'Missing --screenshot-path argument'
                };
            }

            try {
                const fs = nw.require('fs');
                const pathModule = nw.require('path');

                // Remove header if present (e.g. "data:image/png;base64,")
                const base64Image = base64Data.split(';base64,').pop();

                if (!base64Image) {
                    return {
                        success: false,
                        message: 'Invalid base64 data'
                    };
                }

                if (!fs.existsSync(path)) {
                    // Try to create the directory if it doesn't exist? 
                    // Or error out? Requirement "path is a folder". 
                    // Let's assume we should try to ensure it exists or error if it's not a dir.
                    try {
                        fs.mkdirSync(path, { recursive: true });
                    } catch (e) {
                        return {
                            success: false,
                            message: `Failed to create directory: ${path}`
                        };
                    }
                }

                let fullPath = '';

                if (preferredFilename) {
                    fullPath = pathModule.join(path, preferredFilename);
                } else {
                    // Find next available filename
                    let index = 1;
                    let fileName = '';

                    do {
                        const indexStr = index.toString().padStart(4, '0');
                        fileName = `screenshot_${indexStr}.png`;
                        fullPath = pathModule.join(path, fileName);
                        index++;
                        // Safety break to prevent infinite loops in weird cases
                        if (index > 10000) {
                            return {
                                success: false,
                                message: 'Too many screenshots in directory'
                            };
                        }
                    } while (fs.existsSync(fullPath));
                }

                fs.writeFileSync(fullPath, base64Image, { encoding: 'base64' });
                return {
                    success: true,
                    message: 'Screenshot saved to filesystem',
                    path: fullPath
                };
            } catch (ignore) {
                const e = ignore as Error;
                console.error('ScreenshotService: Failed to save screenshot', e);
                return {
                    success: false,
                    message: `Failed to save screenshot: ${e.message}`
                };
            }
        } else {
            console.log('ScreenshotService: Browser environment detected');
            const preview = base64Data.substring(0, 50);
            console.log(`Screenshot preview (base64): ${preview}...`);
            return {
                success: true,
                message: 'Screenshot logged to console (browser mode)'
            };
        }
    }
};
