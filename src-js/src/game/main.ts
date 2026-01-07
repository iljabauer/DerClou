import { GameStartScene } from './scenes/GameStartScene';

import { AUTO, Game, Scale, Types } from 'phaser';

// Find out more information about the Game Config at:
// https://docs.phaser.io/api-documentation/typedef/types-core#gameconfig
const config: Types.Core.GameConfig = {
    type: AUTO,
    width: 320,
    height: 240,
    parent: 'game-container',
    backgroundColor: '#028af8',
    scale: {
        mode: Scale.NONE,
        autoCenter: Scale.CENTER_BOTH
    },
    pixelArt: true,
    plugins: {
        scene: [
        ]
    },
    scene: [
        GameStartScene
    ]
};

const StartGame = (parent: string) => {
    const game = new Game({ ...config, parent });
    (window as unknown as Window & { game: Game }).game = game;
    return game;
}

export default StartGame;
