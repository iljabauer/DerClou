/**
 * Test scene for text system
 */

import { Scene } from 'phaser';
import { TextService, TextLanguage, initTextService } from '../services/TextService';

export class TextTestScene extends Scene {
    private textService: TextService | null = null;
    private statusText!: Phaser.GameObjects.Text;
    private detailsText!: Phaser.GameObjects.Text;

    constructor() {
        super('TextTestScene');
    }

    create() {
        const style = { fontFamily: 'Arial', fontSize: '16px', color: '#ffffff' };

        this.add.text(10, 10, 'Text System Test Scene', { fontSize: '24px', color: '#00ff00' });

        this.statusText = this.add.text(10, 50, 'Status: Initializing...', style);
        this.detailsText = this.add.text(10, 100, '', { ...style, fontSize: '14px', wordWrap: { width: 760 } });

        // Load button
        this.add.text(10, 500, 'Load Texts', {
            backgroundColor: '#004400', padding: { x: 10, y: 5 }, ...style
        })
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () => this.loadTexts());

        // Test menu button
        this.add.text(150, 500, 'Test Menu', {
            backgroundColor: '#000044', padding: { x: 10, y: 5 }, ...style
        })
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () => this.testMenu());

        // Test story button
        this.add.text(290, 500, 'Test Story', {
            backgroundColor: '#440044', padding: { x: 10, y: 5 }, ...style
        })
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () => this.testStory());

        this.statusText.setText('Status: Ready. Click "Load Texts" to begin.');
    }

    private async loadTexts() {
        this.statusText.setText('Status: Loading texts...');
        this.detailsText.setText('');

        try {
            // Initialize text service
            this.textService = initTextService('../gamedata/TEXTS');

            // Load all texts (German by default)
            const success = await this.textService.init(TextLanguage.GERMAN);

            if (success) {
                this.statusText.setText('Status: Texts loaded successfully!');
                this.detailsText.setText(
                    'Text system initialized.\n\n' +
                    'Click "Test Menu" to test menu texts.\n' +
                    'Click "Test Story" to test story texts.'
                );
            } else {
                this.statusText.setText('Status: Failed to load texts');
                this.detailsText.setText('Check console for errors.');
            }
        } catch (error) {
            console.error('Error loading texts:', error);
            this.statusText.setText('Status: Error loading texts');
            this.detailsText.setText(`Error: ${error}`);
        }
    }

    private testMenu() {
        if (!this.textService) {
            this.detailsText.setText('Please load texts first.');
            return;
        }

        try {
            const menuId = this.textService.getTextId('menu');
            if (menuId < 0) {
                this.detailsText.setText('Menu text file not found.');
                return;
            }

            // Try to get some menu text
            let output = 'Menu Text Test:\n\n';

            // Test getting text by key
            const mainMenuText = this.textService.getString(menuId, 'MAIN_MENU');
            if (mainMenuText) {
                output += `MAIN_MENU:\n${mainMenuText}\n\n`;
            } else {
                output += 'MAIN_MENU key not found\n\n';
            }

            // List first few keys
            output += 'Searching for common keys...\n';
            const commonKeys = ['START', 'LOAD', 'SAVE', 'QUIT', 'OPTIONS', 'NEW_GAME'];
            for (const key of commonKeys) {
                if (this.textService.keyExists(menuId, key)) {
                    const text = this.textService.getFirstLine(menuId, key);
                    output += `  ${key}: ${text}\n`;
                }
            }

            this.detailsText.setText(output);
        } catch (error) {
            console.error('Error testing menu:', error);
            this.detailsText.setText(`Error: ${error}`);
        }
    }

    private testStory() {
        if (!this.textService) {
            this.detailsText.setText('Please load texts first.');
            return;
        }

        try {
            const storyId = this.textService.getTextId('story_0');
            if (storyId < 0) {
                this.detailsText.setText('Story text file not found.');
                return;
            }

            let output = 'Story Text Test:\n\n';

            // Try to get first story text
            const firstStory = this.textService.getString(storyId, 'INTRO');
            if (firstStory) {
                output += `INTRO:\n${firstStory.substring(0, 200)}...\n\n`;
            } else {
                output += 'INTRO key not found\n\n';
            }

            // List first few keys
            output += 'Searching for common story keys...\n';
            const commonKeys = ['START', 'INTRO', 'SCENE_1', 'SCENE_2', 'DIALOG_1'];
            for (const key of commonKeys) {
                if (this.textService.keyExists(storyId, key)) {
                    const text = this.textService.getFirstLine(storyId, key);
                    output += `  ${key}: ${text?.substring(0, 50)}...\n`;
                }
            }

            this.detailsText.setText(output);
        } catch (error) {
            console.error('Error testing story:', error);
            this.detailsText.setText(`Error: ${error}`);
        }
    }
}
