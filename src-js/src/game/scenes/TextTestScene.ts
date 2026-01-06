import { Scene } from 'phaser';
import { TextService } from '../services/TextService';

/**
 * Test scene to verify TextService functionality
 * This is a temporary scene for development testing
 */
export class TextTestScene extends Scene {
    private textService: TextService;
    
    constructor() {
        super('TextTestScene');
        this.textService = new TextService();
    }
    
    async create() {
        this.cameras.main.setBackgroundColor('#000000');
        
        // Add loading text
        const loadingText = this.add.text(50, 50, 'Loading MENUD.TXT...', {
            fontFamily: 'Courier New, monospace',
            fontSize: '16px',
            color: '#ffffff'
        });
        
        // Load the menu text file
        const success = await this.textService.loadText('MENU');
        
        if (success) {
            loadingText.setText('MENUD.TXT loaded successfully!');
            
            // Test getting the startup menu
            const startupMenu = this.textService.getLines('MENU', 'STARTUP_MENU');
            
            let y = 100;
            this.add.text(50, y, 'STARTUP_MENU entries:', {
                fontFamily: 'Courier New, monospace',
                fontSize: '16px',
                color: '#00ff00'
            });
            
            y += 30;
            startupMenu.forEach((line, index) => {
                this.add.text(70, y, `${index}: ${line}`, {
                    fontFamily: 'Courier New, monospace',
                    fontSize: '14px',
                    color: '#ffffff'
                });
                y += 25;
            });
            
            // Also test getting the title
            y += 20;
            const title = this.textService.getFirstLine('MENU', 'TITLE');
            this.add.text(50, y, `TITLE: ${title}`, {
                fontFamily: 'Courier New, monospace',
                fontSize: '16px',
                color: '#ffff00'
            });
            
        } else {
            loadingText.setText('Failed to load MENUD.TXT');
            loadingText.setColor('#ff0000');
        }
    }
}
