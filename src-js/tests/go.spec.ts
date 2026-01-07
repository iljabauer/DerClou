import { test, expect } from '@playwright/test';

test.beforeAll(() => {
    // Access the resolved configuration
    const config = test.info().config;
    // Check if updates are set to 'all' (which happens when --update-snapshots is used)
    if (config.updateSnapshots !== 'none') {
        throw new Error(
            "🛑 FORBIDDEN: You are not allowed to use '--update-snapshots' in this environment!"
        );
    }
});

test('go', async ({ page }) => {
    // 1. Setup the communication channel
    let sequenceComplete: (value?: unknown) => void;

    const allEventsCaptured = new Promise((resolve) => {
        sequenceComplete = resolve;
    });
    let screenshotIndex = 1;

    // Increase timeout for long replays
    test.setTimeout(30000);

    await page.exposeFunction('captureEvent', async (eventName: string) => {
        console.log(`📸 Capturing event: ${eventName}`);

        // If 'Finished', we resolve and exit (no screenshot needed usually, or maybe one last one)
        if (eventName === 'Finished') {
            sequenceComplete();
            return;
        }

        // 1. Force the game to pause visually (Engine pause)
        // This stops rendering, physics, and global time, ensuring "Visual Freeze"
        // The game logic is already paused by 'waitingForScreenshot' in GameStartScene
        await page.evaluate(() => (window as unknown as { game: { loop: { sleep: () => void } } }).game.loop.sleep());

        try {
            // 2. Take the screenshot
            // We expect a canvas element to be present
            const canvas = page.locator('canvas');
            const indexStr = screenshotIndex.toString().padStart(4, '0');
            screenshotIndex++;
            await expect.soft(canvas).toHaveScreenshot(`screenshot-${indexStr}.png`, { threshold: 0.05 });
        } finally {
            // 3. Resume the game
            await page.evaluate(() => (window as unknown as { game: { loop: { wake: () => void } } }).game.loop.wake());
        }
    });

    // 2. Load Game
    await page.goto('http://localhost:8080?replay=replays/test_go.rec');

    // Wait for game to be ready (optional, but good practice)
    await page.waitForFunction(() => (window as unknown as { game: unknown }).game && (window as unknown as { startReplay: unknown }).startReplay);

    // Trigger the start
    await page.evaluate(() => (window as unknown as { startReplay: () => void }).startReplay());

    // 4. Wait here until the game calls captureEvent('Finished')
    await allEventsCaptured;
});
