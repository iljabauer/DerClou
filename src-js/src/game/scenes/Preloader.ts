import { Scene } from 'phaser';

export class Preloader extends Scene
{
    constructor ()
    {
        super('Preloader');
    }

    init ()
    {
        this.add.rectangle(160, 100, 100, 10, 0xffffff).setStrokeStyle(1, 0xffffff);
        const bar = this.add.rectangle(160 - 50, 100, 0, 10, 0xffffff);
        this.load.on('progress', (progress: number) => {
            bar.width = 100 * progress;
        });
    }

    preload ()
    {
        this.load.setPath('assets/pictures');

        this.load.image('menu_bg', 'MENU.png');
        this.load.image('menu_font', 'MENU.FNT.png');
        this.load.image('bubble_font', 'BUBBLE.FNT.png');
        this.load.image('wohnung', 'WOHNUNG.png');
    }

    create ()
    {
        // Menu Font: 5x9, starting at 32
        let chars = "";
        for (let i = 32; i < 255; i++) {
            chars += String.fromCharCode(i);
        }

        this.cache.bitmapFont.add('menu_font', Phaser.GameObjects.RetroFont.Parse(this, {
            image: 'menu_font',
            width: 5,
            height: 9,
            chars: chars,
            charsPerRow: 64
        }));

        this.cache.bitmapFont.add('bubble_font', Phaser.GameObjects.RetroFont.Parse(this, {
            image: 'bubble_font',
            width: 4,
            height: 8,
            chars: chars,
            charsPerRow: 80
        }));

        this.scene.start('MainMenu');
    }
}
