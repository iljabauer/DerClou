/**
 * StoryScene - Handles story sequences with dialog and character portraits
 * 
 * Ported from src/story/ and src/present/
 * Displays scenes with backgrounds, characters, speech bubbles, and text.
 */

import { Scene } from 'phaser';
import { SharedReplayService } from '../services/SharedReplayService';
import { TextService } from '../services/TextService';
import { ImageCatalog } from '../services/ImageCatalog';

export class StoryScene extends Scene {
    private sharedReplay: SharedReplayService | null = null;
    private textService: TextService;
    private imageCatalog: ImageCatalog;
    
    private waitingForScreenshot: boolean = false;
    private isPlaying: boolean = false;
    private hasLoaded: boolean = false;
    
    private currentDialogIndex: number = 0;
    private dialogSequence: any[] = [];

    constructor() {
        super('StoryScene');
        this.textService = new TextService();
        this.imageCatalog = new ImageCatalog(this);
    }

    async create() {
        // Set background color
        this.cameras.main.setBackgroundColor('#0a4a4a');

        // Initialize image catalog
        await this.imageCatalog.initialize();

        // Load text files
        await this.textService.loadText('STORY_0');

        // Setup opening sequence from story data
        this.setupOpeningSequence();

        // Show first dialog
        if (this.dialogSequence.length > 0) {
            this.showDialog(this.dialogSequence[0]);
        }
        
        // Get shared replay service
        this.sharedReplay = SharedReplayService.getInstance(this);
        
        // Check if replay is active
        if (this.sharedReplay && this.sharedReplay.isReplayLoaded()) {
            this.hasLoaded = true;
            console.log('StoryScene: Using shared replay service');
            
            // Monitor for replay start
            this.time.addEvent({
                delay: 100,
                loop: true,
                callback: () => {
                    if (this.sharedReplay && this.sharedReplay.isReplayPlaying() && !this.isPlaying) {
                        console.log('StoryScene: Replay started');
                        this.isPlaying = true;
                    }
                }
            });
        }
    }

    private setupOpeningSequence() {
        // Opening monologue at Victoria Station
        // Load text from STORY_0D.TXT
        const storyLines = this.textService.getLines('STORY_0', 'ST_30_OLD');
        const storyText = storyLines.length > 0 ? storyLines.join('\n') : 
            'Ja, genau auf diesen, heute verschlissenen,\nMarmorfliesen begann meine Geschichte\nvor 41 Jahren.\nDamals wollte man den 2. Weltkrieg mit all\ndem Elend, den Entbehrungen und seinen Toten';
        
        this.dialogSequence = [
            {
                scene: 'Victoria Station',
                date: '03.02.1953',
                character: 'Matt',
                portrait: 125, // OLD_MATT_PICTID from theclou.h
                background: 131, // BAHNHOF collection from COLL.LST
                text: storyText
            }
        ];
    }

    update(_time: number, _delta: number) {
        if (this.waitingForScreenshot) {
            return;
        }
        
        if (!this.sharedReplay) {
            return;
        }

        if (this.isPlaying && this.hasLoaded && this.sharedReplay.isReplayComplete()) {
            this.isPlaying = false;
            this.signalScreenshot('Finished');
            console.log('Replay complete.');
        }

        if (this.isPlaying && this.hasLoaded && !this.sharedReplay.isReplayComplete()) {
            const action = this.sharedReplay.simulateTick();
            
            if (action !== null) {
                const tick = this.sharedReplay.getSimulationTick();
                const actionStr = this.sharedReplay.actionToString(action);
                console.log(`[Replay] Tick ${tick}: ${actionStr}`);

                // Handle story progression based on replay actions
                this.handleReplayAction(action);

                // Capture screenshot for non-time actions
                const INP_TIME = 1 << 11;
                if (action & ~INP_TIME) {
                    this.signalScreenshot(`Tick_${tick}_${actionStr.replace(/\s+/g, '_')}`);
                }
            }
        }
    }

    private handleReplayAction(action: number) {
        // Handle dialog progression
        const INP_LBUTTONP = 1 << 5;
        const INP_RIGHT = 1 << 3;

        if (action & (INP_LBUTTONP | INP_RIGHT)) {
            this.advanceDialog();
        }
    }

    private advanceDialog() {
        this.currentDialogIndex++;
        if (this.currentDialogIndex < this.dialogSequence.length) {
            this.showDialog(this.dialogSequence[this.currentDialogIndex]);
        } else {
            // Story sequence complete, transition to Victoria Station (location 58)
            console.log('StoryScene: Dialog sequence complete, transitioning to Victoria Station');
            this.scene.start('LocationScene', { locationId: 58 });
        }
    }

    private async loadAndShowBackground(collectionId: number) {
        // Load the collection image
        const success = await this.imageCatalog.loadCollectionImage(collectionId);
        if (success) {
            const textureKey = this.imageCatalog.getCollectionTextureKey(collectionId);
            const collection = this.imageCatalog.getCollection(collectionId);
            
            if (collection) {
                // Scale to fit screen (original 320x140 -> 1024x448)
                const bg = this.add.image(0, 0, textureKey);
                bg.setOrigin(0, 0);
                bg.setScale(3.2); // 320 * 3.2 = 1024
            }
        }
    }

    private async loadAndShowPortrait(pictureId: number) {
        // Load the picture texture
        const success = await this.imageCatalog.createPictureTexture(pictureId);
        if (success) {
            const textureKey = this.imageCatalog.getPictureTextureKey(pictureId);
            const picture = this.imageCatalog.getPicture(pictureId);
            
            if (picture) {
                // Position portrait on left side
                // Original portrait is 62x67, scale up 3.2x = 198x214
                const portrait = this.add.image(32, 256, textureKey);
                portrait.setOrigin(0, 0);
                portrait.setScale(3.2);
            }
        }
    }

    private async showDialog(dialog: any) {
        // Clear previous dialog
        this.children.removeAll();

        // Draw scene background
        if (dialog.background) {
            await this.loadAndShowBackground(dialog.background);
        } else {
            // Fallback background
            const graphics = this.add.graphics();
            graphics.fillStyle(0x0a4a4a, 1);
            graphics.fillRect(0, 0, 1024, 768);
        }

        // Draw character portrait
        const portraitX = 32;
        const portraitY = 256;
        const portraitWidth = 198; // 62 * 3.2
        const portraitHeight = 214; // 67 * 3.2
        
        if (dialog.portrait) {
            await this.loadAndShowPortrait(dialog.portrait);
        } else {
            // Fallback portrait placeholder
            const graphics = this.add.graphics();
            graphics.lineStyle(4, 0xccaa66);
            graphics.strokeRect(portraitX, portraitY, portraitWidth, portraitHeight);
            graphics.fillStyle(0x663333, 1);
            graphics.fillRect(portraitX + 4, portraitY + 4, portraitWidth - 8, portraitHeight - 8);
        }

        // Draw speech bubble with text
        const bubbleX = 250;
        const bubbleY = 80;
        const bubbleWidth = 760;
        const bubbleHeight = 220;

        // Create graphics for bubble
        const bubbleGraphics = this.add.graphics();
        
        // Draw bubble background
        bubbleGraphics.fillStyle(0xdddddd, 1);
        bubbleGraphics.fillRect(bubbleX, bubbleY, bubbleWidth, bubbleHeight);
        
        // Draw bubble border
        bubbleGraphics.lineStyle(2, 0x000000);
        bubbleGraphics.strokeRect(bubbleX, bubbleY, bubbleWidth, bubbleHeight);
        
        // Draw pointer from bubble to portrait
        bubbleGraphics.fillStyle(0xdddddd, 1);
        bubbleGraphics.fillTriangle(
            bubbleX, bubbleY + 50,
            bubbleX, bubbleY + 80,
            portraitX + portraitWidth, bubbleY + 65
        );
        bubbleGraphics.lineStyle(2, 0x000000);
        bubbleGraphics.strokeTriangle(
            bubbleX, bubbleY + 50,
            bubbleX, bubbleY + 80,
            portraitX + portraitWidth, bubbleY + 65
        );

        // Draw text in bubble
        this.add.text(
            bubbleX + 20,
            bubbleY + 20,
            dialog.text,
            {
                fontFamily: 'Courier New, monospace',
                fontSize: '16px',
                color: '#000000',
                wordWrap: { width: bubbleWidth - 40 }
            }
        );

        // Draw location and date at bottom
        const locationText = `${dialog.scene} ${dialog.date}`;
        this.add.text(
            512,
            690,
            locationText,
            {
                fontFamily: 'Courier New, monospace',
                fontSize: '20px',
                color: '#ffffff',
                align: 'center'
            }
        ).setOrigin(0.5);
    }



    private signalScreenshot(name: string) {
        if ((window as any).captureEvent) {
            this.waitingForScreenshot = true;
            (window as any).captureEvent(name).then(() => {
                this.waitingForScreenshot = false;
            }).catch((e: any) => {
                console.warn(`captureEvent failed: ${e}`);
                this.waitingForScreenshot = false;
            });
        }
    }
}
