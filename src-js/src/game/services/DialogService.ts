/**
 * DialogService - Handles speech bubbles and dialog display
 * 
 * Ported from src/dialog/dialog.c and src/present/interac.c
 * 
 * Displays text in speech bubbles with optional character portraits
 */

import { Scene } from 'phaser';
import { TextService } from './TextService';

export enum BubbleType {
    SPEAK = 'speak',
    THINK = 'think'
}

export interface DialogOptions {
    bubbleType?: BubbleType;
    personId?: number;
    waitTime?: number;
    onComplete?: () => void;
}

export class DialogService {
    private scene: Scene;
    private textService: TextService;
    private currentBubbleType: BubbleType = BubbleType.SPEAK;
    private activPersonId: number = -1;
    
    // Bubble display constants (from C code)
    private static readonly BUBBLE_X = 104;
    private static readonly BUBBLE_Y = 0;
    private static readonly BUBBLE_WIDTH = 216;
    private static readonly BUBBLE_HEIGHT = 54;
    private static readonly TEXT_PADDING = 8;
    private static readonly LINE_HEIGHT = 12;
    
    constructor(scene: Scene, textService: TextService) {
        this.scene = scene;
        this.textService = textService;
    }
    
    /**
     * Set the bubble type for subsequent dialogs
     */
    setBubbleType(type: BubbleType): void {
        this.currentBubbleType = type;
    }
    
    /**
     * Set the active person for portrait display
     */
    setPersonId(personId: number): void {
        this.activPersonId = personId;
    }
    
    /**
     * Display a speech bubble with text
     * Ported from Say() and Bubble() functions
     * 
     * @param textId Text file ID
     * @param key Text key to display
     * @param options Dialog options
     * @returns Promise that resolves when dialog is dismissed
     */
    async say(textId: string, key: string, options: DialogOptions = {}): Promise<number> {
        const bubbleType = options.bubbleType || this.currentBubbleType;
        const personId = options.personId !== undefined ? options.personId : this.activPersonId;
        
        // Get text lines
        const lines = this.textService.getLines(textId, key);
        if (lines.length === 0) {
            console.warn(`No text found for ${textId}:${key}`);
            return 0;
        }
        
        // Create bubble container
        const bubble = this.createBubble(lines, bubbleType, personId);
        
        // Wait for user input or timeout
        return new Promise((resolve) => {
            const handleInput = () => {
                this.destroyBubble(bubble);
                if (options.onComplete) {
                    options.onComplete();
                }
                resolve(1);
            };
            
            if (options.waitTime) {
                // Auto-dismiss after waitTime
                this.scene.time.delayedCall(options.waitTime, handleInput);
            } else {
                // Wait for click
                this.scene.input.once('pointerdown', handleInput);
            }
        });
    }
    
    /**
     * Create and display a speech bubble
     */
    private createBubble(lines: string[], bubbleType: BubbleType, personId: number): Phaser.GameObjects.Container {
        const container = this.scene.add.container(0, 0);
        
        // Draw bubble background
        const bubbleGraphics = this.scene.add.graphics();
        
        // Bubble color based on type
        const bubbleColor = bubbleType === BubbleType.SPEAK ? 0x2a4a4a : 0x3a3a5a;
        const borderColor = 0x00ff00;
        
        // Draw bubble rectangle
        bubbleGraphics.fillStyle(bubbleColor, 1);
        bubbleGraphics.fillRect(
            DialogService.BUBBLE_X,
            DialogService.BUBBLE_Y,
            DialogService.BUBBLE_WIDTH,
            DialogService.BUBBLE_HEIGHT
        );
        
        // Draw border
        bubbleGraphics.lineStyle(1, borderColor, 1);
        bubbleGraphics.strokeRect(
            DialogService.BUBBLE_X,
            DialogService.BUBBLE_Y,
            DialogService.BUBBLE_WIDTH,
            DialogService.BUBBLE_HEIGHT
        );
        
        container.add(bubbleGraphics);
        
        // Add text lines
        let y = DialogService.BUBBLE_Y + DialogService.TEXT_PADDING;
        const maxLines = Math.floor((DialogService.BUBBLE_HEIGHT - DialogService.TEXT_PADDING * 2) / DialogService.LINE_HEIGHT);
        
        for (let i = 0; i < Math.min(lines.length, maxLines); i++) {
            const textObj = this.scene.add.text(
                DialogService.BUBBLE_X + DialogService.TEXT_PADDING,
                y,
                lines[i],
                {
                    fontFamily: 'Courier New, monospace',
                    fontSize: '12px',
                    color: '#ffffff',
                    wordWrap: {
                        width: DialogService.BUBBLE_WIDTH - DialogService.TEXT_PADDING * 2
                    }
                }
            );
            container.add(textObj);
            y += DialogService.LINE_HEIGHT;
        }
        
        // Add bubble indicator (speech/think)
        if (bubbleType === BubbleType.SPEAK) {
            // Draw speech bubble pointer (simple triangle)
            const pointer = this.scene.add.graphics();
            pointer.fillStyle(bubbleColor, 1);
            pointer.fillTriangle(
                DialogService.BUBBLE_X + 20, DialogService.BUBBLE_Y + DialogService.BUBBLE_HEIGHT,
                DialogService.BUBBLE_X + 30, DialogService.BUBBLE_Y + DialogService.BUBBLE_HEIGHT,
                DialogService.BUBBLE_X + 25, DialogService.BUBBLE_Y + DialogService.BUBBLE_HEIGHT + 10
            );
            container.add(pointer);
        } else {
            // Draw thought bubble circles
            const circles = this.scene.add.graphics();
            circles.fillStyle(bubbleColor, 1);
            circles.fillCircle(DialogService.BUBBLE_X + 25, DialogService.BUBBLE_Y + DialogService.BUBBLE_HEIGHT + 5, 3);
            circles.fillCircle(DialogService.BUBBLE_X + 20, DialogService.BUBBLE_Y + DialogService.BUBBLE_HEIGHT + 10, 2);
            container.add(circles);
        }
        
        // TODO: Add character portrait if personId is valid
        if (personId !== -1) {
            // For now, just add a placeholder
            const portraitPlaceholder = this.scene.add.graphics();
            portraitPlaceholder.fillStyle(0x404040, 1);
            portraitPlaceholder.fillRect(10, 10, 80, 100);
            portraitPlaceholder.lineStyle(1, borderColor, 1);
            portraitPlaceholder.strokeRect(10, 10, 80, 100);
            container.add(portraitPlaceholder);
        }
        
        return container;
    }
    
    /**
     * Destroy a bubble and clean up
     */
    private destroyBubble(bubble: Phaser.GameObjects.Container): void {
        bubble.destroy();
    }
    
    /**
     * Display a simple monologue (single character speaking)
     * This is a convenience wrapper around say()
     */
    async monologue(textId: string, key: string, personId: number = -1): Promise<void> {
        this.setBubbleType(BubbleType.SPEAK);
        this.setPersonId(personId);
        await this.say(textId, key);
    }
}
