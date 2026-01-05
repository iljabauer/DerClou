/**
 * Test scene for UI system (menus and bubbles)
 */

import { Scene } from 'phaser';
import { UIService, GET_OUT } from '../services/UIService';
import { TextService, TextLanguage, initTextService } from '../services/TextService';

export class UITestScene extends Scene {
    private uiService!: UIService;
    private textService: TextService | null = null;
    private statusText!: Phaser.GameObjects.Text;

    constructor() {
        super('UITestScene');
    }

    create() {
        this.uiService = new UIService(this);

        const style = { fontFamily: 'Arial', fontSize: '16px', color: '#ffffff' };

        this.add.text(10, 10, 'UI System Test Scene', { fontSize: '24px', color: '#00ff00' });

        this.statusText = this.add.text(10, 50, 'Status: Ready', style);

        // Test buttons
        this.add.text(10, 100, 'Test Simple Menu', {
            backgroundColor: '#004400', padding: { x: 10, y: 5 }, ...style
        })
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () => this.testSimpleMenu());

        this.add.text(200, 100, 'Test Bubble', {
            backgroundColor: '#000044', padding: { x: 10, y: 5 }, ...style
        })
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () => this.testBubble());

        this.add.text(10, 150, 'Test Menu with Text', {
            backgroundColor: '#440044', padding: { x: 10, y: 5 }, ...style
        })
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () => this.testMenuWithText());

        this.add.text(200, 150, 'Test Disabled Items', {
            backgroundColor: '#444400', padding: { x: 10, y: 5 }, ...style
        })
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () => this.testDisabledItems());

        this.add.text(10, 200, 'Load Text System', {
            backgroundColor: '#004444', padding: { x: 10, y: 5 }, ...style
        })
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () => this.loadTextSystem());
    }

    private async testSimpleMenu() {
        this.statusText.setText('Status: Showing simple menu...');

        const result = await this.uiService.showMenu({
            items: [
                { text: 'Option 1', enabled: true },
                { text: 'Option 2', enabled: true },
                { text: 'Option 3', enabled: true },
                { text: 'Option 4', enabled: true },
                { text: 'Exit', enabled: true }
            ],
            activeIndex: 0,
            onChange: (index) => {
                console.log('Menu changed to:', index);
            }
        });

        if (result === GET_OUT) {
            this.statusText.setText('Status: Menu cancelled');
        } else {
            this.statusText.setText(`Status: Selected option ${result + 1}`);
        }
    }

    private async testBubble() {
        this.statusText.setText('Status: Showing bubble...');

        const result = await this.uiService.showBubble({
            lines: [
                'This is a test bubble dialog.',
                'You can select different lines.',
                'Use arrow keys or mouse.',
                'Press Enter or click to select.',
                'Press Escape to cancel.'
            ],
            activeIndex: 0,
            onChange: (index) => {
                console.log('Bubble line changed to:', index);
            }
        });

        if (result === GET_OUT) {
            this.statusText.setText('Status: Bubble cancelled');
        } else {
            this.statusText.setText(`Status: Selected line ${result + 1}`);
        }
    }

    private async testMenuWithText() {
        if (!this.textService) {
            this.statusText.setText('Status: Load text system first!');
            return;
        }

        this.statusText.setText('Status: Showing menu with text...');

        // Try to get menu items from text system
        const menuId = this.textService.getTextId('menu');
        let items = [
            { text: 'New Game', enabled: true },
            { text: 'Load Game', enabled: true },
            { text: 'Options', enabled: true },
            { text: 'Quit', enabled: true }
        ];

        // If menu text is available, use it
        if (menuId >= 0) {
            const menuKeys = ['NEW_GAME', 'LOAD_GAME', 'OPTIONS', 'QUIT'];
            const textItems = [];
            
            for (const key of menuKeys) {
                const text = this.textService.getFirstLine(menuId, key);
                if (text) {
                    textItems.push({ text, enabled: true });
                }
            }

            if (textItems.length > 0) {
                items = textItems;
            }
        }

        const result = await this.uiService.showMenu({
            items,
            activeIndex: 0
        });

        if (result === GET_OUT) {
            this.statusText.setText('Status: Menu cancelled');
        } else {
            this.statusText.setText(`Status: Selected "${items[result].text}"`);
        }
    }

    private async testDisabledItems() {
        this.statusText.setText('Status: Showing menu with disabled items...');

        const result = await this.uiService.showMenu({
            items: [
                { text: 'Enabled 1', enabled: true },
                { text: 'Disabled 1', enabled: false },
                { text: 'Enabled 2', enabled: true },
                { text: 'Disabled 2', enabled: false },
                { text: 'Enabled 3', enabled: true }
            ],
            activeIndex: 0
        });

        if (result === GET_OUT) {
            this.statusText.setText('Status: Menu cancelled');
        } else {
            this.statusText.setText(`Status: Selected option ${result + 1}`);
        }
    }

    private async loadTextSystem() {
        this.statusText.setText('Status: Loading text system...');

        try {
            this.textService = initTextService('../gamedata/TEXTS');
            const success = await this.textService.init(TextLanguage.GERMAN);

            if (success) {
                this.statusText.setText('Status: Text system loaded! Try "Test Menu with Text"');
            } else {
                this.statusText.setText('Status: Failed to load text system');
            }
        } catch (error) {
            console.error('Error loading text system:', error);
            this.statusText.setText(`Status: Error - ${error}`);
        }
    }

    shutdown() {
        if (this.uiService) {
            this.uiService.destroy();
        }
    }
}
