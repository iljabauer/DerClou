import { GameScene } from './scenes/GameScene';
import { ReplayTestScene } from './scenes/ReplayTestScene';
import { ScreenshotTestScene } from './scenes/ScreenshotTestScene';
import { TestGameScene } from './scenes/TestGameScene';
import { DataLoaderTestScene } from './scenes/DataLoaderTestScene';
import { TextTestScene } from './scenes/TextTestScene';
import { UITestScene } from './scenes/UITestScene';
import { ImageTestScene } from './scenes/ImageTestScene';
import { PresentationTestScene } from './scenes/PresentationTestScene';
import { LivingTestScene } from './scenes/LivingTestScene';
import { DialogTestScene } from './scenes/DialogTestScene';
import { InteractionTestScene } from './scenes/InteractionTestScene';
import { OrganisationTestScene } from './scenes/OrganisationTestScene';
import { Game as MainGame } from './scenes/Game';
import { AUTO, Game, Scale, Types } from 'phaser';

// Find out more information about the Game Config at:
// https://docs.phaser.io/api-documentation/typedef/types-core#gameconfig
const config: Types.Core.GameConfig = {
    type: AUTO,
    width: 1024,
    height: 768,
    parent: 'game-container',
    backgroundColor: '#000000',
    scale: {
        mode: Scale.FIT,
        autoCenter: Scale.CENTER_BOTH
    },
    scene: [
        GameScene,
        ReplayTestScene,
        OrganisationTestScene,
        InteractionTestScene,
        DialogTestScene,
        LivingTestScene,
        PresentationTestScene,
        ImageTestScene,
        UITestScene,
        TextTestScene,
        DataLoaderTestScene,
        ScreenshotTestScene,
        TestGameScene,
        MainGame
    ]
};

const StartGame = (parent: string) => {
    return new Game({ ...config, parent });
}

export default StartGame;
