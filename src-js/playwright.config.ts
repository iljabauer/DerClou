import { defineConfig } from '@playwright/test';

export default defineConfig({
    testDir: './tests',
    /* Run tests in files in parallel */
    fullyParallel: true,
    /* Fail the build on CI if you accidentally left test.only in the source code. */
    forbidOnly: !!process.env.CI,
    /* Retry on CI only */
    retries: process.env.CI ? 2 : 0,
    /* Opt out of parallel tests on CI. */
    workers: process.env.CI ? 1 : undefined,
    /* Reporter to use. See https://playwright.dev/docs/test-reporters */
    reporter: [
        ['list'], // Console reporter
        ['html', { open: 'never' }] // HTML reporter with auto-open disabled
    ],
    /* Disable snapshot updates */
    updateSnapshots: 'none',

    /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
    use: {
        // Exact size you want your canvas to be
        viewport: { width: 320, height: 240 },
        // Ensure scaling is 1:1 (no high-DPI scaling)
        deviceScaleFactor: 1,
        /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
        trace: 'on-first-retry',
    },

    /* Configure projects for major browsers */
    projects: [
        {
            name: 'chromium',
            use: {
                // Browser configured here
            },
        },
    ],

    /* Custom snapshot path template to remove platform suffix */
    snapshotPathTemplate: '{testDir}/{testFileDir}/{testFileName}-snapshots/{arg}{ext}',

    /* Run your local dev server before starting the tests */
    webServer: {
        command: 'npm run dev',
        port: 8080,
        reuseExistingServer: !process.env.CI,
    },
});
