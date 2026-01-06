import { RouterScene } from './scenes/RouterScene';
import { MainMenuScene } from './scenes/MainMenuScene';
import { StoryScene } from './scenes/StoryScene';
import { MonologueScene } from './scenes/MonologueScene';
import { AUTO, Game, Scale, Types } from 'phaser';

// Find out more information about the Game Config at:
// https://docs.phaser.io/api-documentation/typedef/types-core#gameconfig
const config: Types.Core.GameConfig = {
    type: AUTO,
    width: 1024,
    height: 768,
    parent: 'game-container',
    backgroundColor: '#028af8',
    scale: {
        mode: Scale.FIT,
        autoCenter: Scale.CENTER_BOTH
    },
    pixelArt: true,
    scene: [
        RouterScene,
        MainMenuScene,
        StoryScene,
        MonologueScene
    ]
};

const StartGame = (parent: string) => {
    const game = new Game({ ...config, parent });
    (window as any).game = game;
    return game;
}

export default StartGame;
