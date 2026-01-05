import { Boot } from './game/scenes/Boot';
import { Game as MainGame } from './game/scenes/Game';
import { MainMenu } from './game/scenes/MainMenu';
import { Preloader } from './game/scenes/Preloader';

import { Game, Types } from "phaser";

//  Find out more information about the Game Config at:
//  https://newdocs.phaser.io/docs/3.70.0/Phaser.Types.Core.GameConfig
const config: Types.Core.GameConfig = {
    type: Phaser.AUTO,
    width: 320,
    height: 200,
    parent: 'game-container',
    backgroundColor: '#000000',
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        zoom: 2
    },
    pixelArt: true,
    scene: [
        Boot,
        Preloader,
        MainMenu,
        MainGame
    ]
};

export default new Game(config);
