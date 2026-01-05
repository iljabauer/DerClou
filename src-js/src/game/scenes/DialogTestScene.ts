/**
 * Test scene for DialogService
 */

import { Scene } from 'phaser';
import { DialogService, BUSINESS_TXT, MATT_PICTID, DLG_TALKMODE_STANDARD } from '../services/DialogService';
import { TextService } from '../services/TextService';
import { UIService } from '../services/UIService';
import { ImageService } from '../services/ImageService';
import { db } from '../core/Database';
import { Person, ObjectType } from '../types/GameTypes';

export class DialogTestScene extends Scene {
    private dialogService!: DialogService;
    private textService!: TextService;
    private uiService!: UIService;
    private imageService!: ImageService;
    private statusText!: Phaser.GameObjects.Text;

    constructor() {
        super('DialogTestScene');
    }

    async create() {
        const style = { fontFamily: 'Arial', fontSize: '16px', color: '#ffffff' };

        this.add.text(10, 10, 'Dialog System Test Scene', { fontSize: '24px', color: '#00ff00' });

        this.statusText = this.add.text(10, 50, 'Status: Initializing...', style);

        // Initialize services
        this.textService = new TextService();
        await this.textService.init();
        
        this.imageService = new ImageService();
        await this.imageService.init();
        
        this.uiService = new UIService(this);
        this.dialogService = new DialogService(this, this.textService, this.uiService, this.imageService, db);

        this.statusText.setText('Status: Dialog system initialized');

        // Test buttons
        this.add.text(10, 100, 'Test Say()', {
            backgroundColor: '#004400', padding: { x: 10, y: 5 }, ...style
        })
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () => this.testSay());

        this.add.text(200, 100, 'Test Bubble()', {
            backgroundColor: '#000044', padding: { x: 10, y: 5 }, ...style
        })
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () => this.testBubble());

        this.add.text(400, 100, 'Test Think()', {
            backgroundColor: '#440044', padding: { x: 10, y: 5 }, ...style
        })
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () => this.testThink());

        this.add.text(10, 150, 'Test Text Keys', {
            backgroundColor: '#444400', padding: { x: 10, y: 5 }, ...style
        })
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () => this.testTextKeys());

        this.add.text(200, 150, 'Test DynamicTalk()', {
            backgroundColor: '#440000', padding: { x: 10, y: 5 }, ...style
        })
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () => this.testDynamicTalk());

        this.add.text(10, 200, 'Instructions:', { fontSize: '14px', color: '#ffff00' });
        this.add.text(10, 220, 'Click buttons to test dialog system functionality', style);
        this.add.text(10, 240, 'Use arrow keys and Enter to navigate dialogs', style);
        this.add.text(10, 260, 'Press Escape to close dialogs', style);
    }

    private async testSay(): Promise<void> {
        this.statusText.setText('Status: Testing Say()...');
        
        try {
            // Try to display a dialog from BUSINESS_TXT
            const choice = await this.dialogService.say(
                BUSINESS_TXT,
                0,
                MATT_PICTID,
                'HELLO'
            );
            
            this.statusText.setText(`Status: Say() returned choice ${choice}`);
        } catch (error) {
            this.statusText.setText(`Status: Say() error - ${error}`);
            console.error('Say() test error:', error);
        }
    }

    private async testBubble(): Promise<void> {
        this.statusText.setText('Status: Testing Bubble()...');
        
        try {
            const lines = [
                'This is a test bubble',
                'With multiple lines',
                'You can select one',
                'Or press Escape to exit'
            ];
            
            const choice = await this.dialogService.bubble(lines, 0);
            
            this.statusText.setText(`Status: Bubble() returned choice ${choice}`);
        } catch (error) {
            this.statusText.setText(`Status: Bubble() error - ${error}`);
            console.error('Bubble() test error:', error);
        }
    }

    private async testThink(): Promise<void> {
        this.statusText.setText('Status: Testing Think()...');
        
        try {
            const lines = [
                'This is a thinking bubble',
                'Matt is thinking...',
                'What should I do?'
            ];
            
            const choice = await this.dialogService.think(lines, 0);
            
            this.statusText.setText(`Status: Think() returned choice ${choice}`);
        } catch (error) {
            this.statusText.setText(`Status: Think() error - ${error}`);
            console.error('Think() test error:', error);
        }
    }

    private async testTextKeys(): Promise<void> {
        this.statusText.setText('Status: Testing text keys...');
        
        try {
            // List some available text keys from BUSINESS_TXT
            const keys = ['HELLO', 'GOODBYE', 'YES', 'NO'];
            const results: string[] = [];
            
            for (const key of keys) {
                const lines = this.textService.getTextLines(BUSINESS_TXT, key);
                if (lines) {
                    results.push(`${key}: ${lines.length} lines`);
                } else {
                    results.push(`${key}: NOT FOUND`);
                }
            }
            
            // Show results in a bubble
            await this.dialogService.bubble(results, 0);
            
            this.statusText.setText('Status: Text key test complete');
        } catch (error) {
            this.statusText.setText(`Status: Text key test error - ${error}`);
            console.error('Text key test error:', error);
        }
    }

    private async testDynamicTalk(): Promise<void> {
        this.statusText.setText('Status: Testing DynamicTalk()...');
        
        try {
            // Create two test persons
            const matt: Person = {
                id: 1,
                name: 'Matt',
                type: ObjectType.Person,
                pictId: MATT_PICTID,
                job: 0,
                sex: 0,
                age: 30,
                health: 100,
                mood: 100,
                intelligence: 100,
                strength: 100,
                stamina: 100,
                loyalty: 100,
                skill: 100,
                known: 0,
                popularity: 50,
                avarice: 50,
                panic: 0,
                knownToPolice: 0,
                talkBits: 0,
                talkFileId: 0,
                oldHealth: 100
            };

            const npc: Person = {
                id: 2,
                name: 'TestNPC',
                type: ObjectType.Person,
                pictId: 1,
                job: 0,
                sex: 0,
                age: 35,
                health: 100,
                mood: 100,
                intelligence: 80,
                strength: 80,
                stamina: 80,
                loyalty: 80,
                skill: 80,
                known: 0,
                popularity: 50,
                avarice: 50,
                panic: 0,
                knownToPolice: 0,
                talkBits: 0,
                talkFileId: 0,
                oldHealth: 100
            };

            // Add to database
            db.addObject(matt);
            db.addObject(npc);

            // Test conversation
            await this.dialogService.dynamicTalk(matt.id, npc.id, DLG_TALKMODE_STANDARD);
            
            this.statusText.setText('Status: DynamicTalk() test complete');
        } catch (error) {
            this.statusText.setText(`Status: DynamicTalk() error - ${error}`);
            console.error('DynamicTalk() test error:', error);
        }
    }
}
