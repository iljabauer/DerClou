import { Scene } from 'phaser';
import { ScreenshotService } from '../services/ScreenshotService';

export class ScreenshotTestScene extends Scene {
    constructor() {
        super('ScreenshotTestScene');
    }

    create() {
        // Blank background (already black by default, but let's make it clear?)
        // The requirements say "display a blank background". Default is usually black or whatever clear color.
        // Let's set a background color just to be sure, or just leave it.
        // Game config says backgroundColor: '#028af8' (from main.ts I saw earlier).
        // Let's leave it as is, or maybe add a solid rect.
        // Req: "display a blank background". The game config background is fine.

        // Add Screenshot Button
        const button = this.add.text(this.scale.width / 2, this.scale.height / 2, 'Capture Screenshot', {
            fontFamily: 'Arial',
            fontSize: '32px',
            color: '#ffffff',
            backgroundColor: '#000000',
            padding: { x: 20, y: 10 }
        })
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true });

        button.on('pointerdown', () => {
            console.log('Screenshot button clicked');
            this.captureScreenshot();
        });

        // Add a visual indicator that we are in the test scene
        this.add.text(10, 10, 'Screenshot Test Scene', { fontSize: '16px', color: '#ffffff' });

        // Auto-screenshot in headless mode
        if (ScreenshotService.isHeadlessMode()) {
            console.log('Headless mode detected. Taking screenshot and exiting...');
            // Wait for 2 frames to ensure rendering is complete
            this.time.delayedCall(100, () => {
                this.captureScreenshot(true);
            });
        }
    }

    private captureScreenshot(exitAfter: boolean = false) {
        // Use Phaser's renderer snapshot
        this.game.renderer.snapshot((image: HTMLImageElement | any) => {
            if (image && image.src) {
                const result = ScreenshotService.saveScreenshot(image.src);
                console.log('Screenshot result:', result);
                if (exitAfter) {
                    ScreenshotService.exitApp();
                }
            } else {
                console.error('Failed to capture snapshot');
                if (exitAfter) {
                    ScreenshotService.exitApp(); // Exit anyway to avoid hanging
                }
            }
        });
    }
}
