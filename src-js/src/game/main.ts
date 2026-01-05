import { BootScene } from './scenes/BootScene';
import { MenuScene } from './scenes/MenuScene';
import { StoryScene } from './scenes/StoryScene';
import { ReplayTestScene } from './scenes/ReplayTestScene';
import { ScreenshotTestScene } from './scenes/ScreenshotTestScene';
import { Game as MainGame } from './scenes/Game';
import { AUTO, Game, Scale, Types } from 'phaser';

// Find out more information about the Game Config at:
// https://docs.phaser.io/api-documentation/typedef/types-core#gameconfig
const config: Types.Core.GameConfig = {
    type: AUTO,
    width: 320, // Native resolution 320x200
    height: 200,
    parent: 'game-container',
    backgroundColor: '#000000',
    scale: {
        mode: Scale.FIT,
        autoCenter: Scale.CENTER_BOTH
    },
    pixelArt: true, // Important for retro look
    scene: [
        BootScene,
        MenuScene,
        StoryScene,
        MainGame,
        ReplayTestScene,
        ScreenshotTestScene
    ]
};

const StartGame = (parent: string) => {
    return new Game({ ...config, parent });
}

export default StartGame;
