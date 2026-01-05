import { Scene } from 'phaser';

export class Game extends Scene
{
    constructor ()
    {
        super('Game');
    }

    create ()
    {
        this.add.image(0, 0, 'wohnung').setOrigin(0, 0);

        this.add.bitmapText(160, 10, 'bubble_font', 'The Clou! - Port').setOrigin(0.5);
        this.add.bitmapText(160, 180, 'bubble_font', 'Press ESC to return to Menu').setOrigin(0.5);

        this.input.keyboard?.on('keydown-ESC', () => {
            this.scene.start('MainMenu');
        });
    }
}
