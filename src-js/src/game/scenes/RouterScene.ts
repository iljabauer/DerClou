/**
 * RouterScene - Determines which scene to start based on URL parameters
 * 
 * This scene acts as an entry point that routes to the appropriate game scene
 * based on the replay file or other URL parameters.
 */

import { Scene } from 'phaser';

export class RouterScene extends Scene {
    constructor() {
        super('RouterScene');
    }

    create() {
        // Check URL parameters to determine which scene to start
        const urlParams = new URLSearchParams(window.location.search);
        const replayPath = urlParams.get('replay');

        let targetScene = 'MainMenuScene';

        if (replayPath) {
            // Determine scene based on replay file name
            if (replayPath.includes('test_main_menu')) {
                targetScene = 'MainMenuScene';
            } else if (replayPath.includes('test_monologue')) {
                targetScene = 'MonologueScene';
            } else if (replayPath.includes('test_go')) {
                // 'go' test - navigation/movement scene
                targetScene = 'StoryScene';
            } else if (replayPath.includes('test_long') || replayPath.includes('first-burglary')) {
                // Full game flow
                targetScene = 'MainMenuScene';
            } else {
                // Default to MainMenuScene for unknown replays
                targetScene = 'MainMenuScene';
            }
        }

        console.log(`RouterScene: Starting ${targetScene}`);
        this.scene.start(targetScene);
    }
}
