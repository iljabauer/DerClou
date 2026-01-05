import { Scene } from 'phaser';

export class MainMenu extends Scene
{
    private selectedIndex: number = 0;
    private options: string[] = ['Start New Game', 'Load Game', 'Quit Game'];
    private menuTextObjects: Phaser.GameObjects.BitmapText[] = [];

    constructor ()
    {
        super('MainMenu');
    }

    create ()
    {
        this.add.image(0, 0, 'menu_bg').setOrigin(0, 0);

        const startY = 60;
        const spacing = 12;

        for (let i = 0; i < this.options.length; i++) {
            const text = this.add.bitmapText(160, startY + (i * spacing), 'menu_font', this.options[i]);
            text.setOrigin(0.5, 0);
            this.menuTextObjects.push(text);
        }

        this.updateSelection();

        this.input.keyboard?.on('keydown-DOWN', () => {
            this.selectedIndex = (this.selectedIndex + 1) % this.options.length;
            this.updateSelection();
        });

        this.input.keyboard?.on('keydown-UP', () => {
            this.selectedIndex = (this.selectedIndex - 1 + this.options.length) % this.options.length;
            this.updateSelection();
        });

        this.input.keyboard?.on('keydown-ENTER', () => {
            this.selectOption();
        });

        this.input.keyboard?.on('keydown-SPACE', () => {
            this.selectOption();
        });
    }

    updateSelection() {
        this.menuTextObjects.forEach((text, index) => {
            if (index === this.selectedIndex) {
                text.setTint(0xffff00); // Yellow/Highlight
            } else {
                text.setTint(0xffffff);
            }
        });
    }

    selectOption() {
        if (this.selectedIndex === 0) {
            this.scene.start('Game');
        } else {
            console.log("Selected: " + this.options[this.selectedIndex]);
        }
    }
}
