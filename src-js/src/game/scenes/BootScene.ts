
import { Scene } from 'phaser';
import { Services } from '../services/Services';
import { ScreenshotService } from '../services/ScreenshotService';

declare const nw: any;

export class BootScene extends Scene {
    constructor() {
        super('BootScene');
    }

    preload() {
        this.load.setPath('assets');
        this.load.image('background', 'bg.png');
        this.load.image('logo', 'logo.png');
    }

    async create() {
        console.log('BootScene started');

        // Init Text
        await Services.text.loadTexts('E');

        // Init Story
        await Services.story.loadStory();

        // Init Anim Data
        await Services.anim.loadData();

        // Init Fonts
        await Services.font.loadFonts(this);

        // Check for Replay
        let replayPath = '';
        if (typeof nw !== 'undefined' && nw.App && nw.App.argv) {
            const argv = nw.App.argv;
            for (const arg of argv) {
                if (arg.startsWith('--replay-path=')) {
                    replayPath = arg.split('=')[1];
                    break;
                }
            }
        }

        if (replayPath) {
            console.log(`Loading replay from ${replayPath}`);
            const data = await Services.replay.loadReplay(replayPath);
            if (data) {
                Services.replay.initPlayback(data);
                console.log('Replay initialized');
            } else {
                console.error('Failed to load replay');
            }
        }

        // Init Input
        Services.input.init();

        // Start Menu
        this.scene.start('MenuScene');
    }
}
