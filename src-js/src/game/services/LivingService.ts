/**
 * Living Service - Port of src/living/living.c
 * 
 * Manages characters (livings) and their animations in locations.
 * Handles character positioning, animation, and visibility.
 */

import { Scene } from 'phaser';
import { ImageService } from './ImageService';

// Animation actions
export enum AnimAction {
    MOVE_UP = 0,
    MOVE_DOWN = 1,
    MOVE_RIGHT = 2,
    MOVE_LEFT = 3,
    WORK_UP = 4,
    WORK_DOWN = 5,
    WORK_LEFT = 6,
    WORK_RIGHT = 7,
    DUSEL = 8,          // for burglars
    ELEKTRO = 8,        // for burglars
    STAND = 9,
    MAKE_CALL = 9,      // for burglars
    WORK_CONTROL = 4,   // for policemen
    DUSEL_POLICE = 5    // for policemen
}

// Play modes
export enum PlayMode {
    NORMAL = 1,
    REVERSE = 2
}

// Living status
export enum LivingStatus {
    DISABLED = 0,
    ENABLED = 1
}

// Animation template - defines a character animation type
interface AnimTemplate {
    name: string;
    width: number;
    height: number;
    frameOffsetNr: number;
}

// Living - a character instance
interface Living {
    name: string;
    livesInAreaId: number;
    livingNr: number;
    originTemplate: AnimTemplate;
    xSize: number;
    ySize: number;
    xSpeed: number;
    ySpeed: number;
    xPos: number;
    yPos: number;
    viewDirection: number;
    action: AnimAction;
    oldAction: AnimAction;
    currFrameNr: number;
    status: LivingStatus;
    sprite?: Phaser.GameObjects.Sprite;
}

// Sprite control - main state
interface SpriteControl {
    livings: Map<string, Living>;
    templates: Map<string, AnimTemplate>;
    sprPlayMode: PlayMode;
    activAreaId: number;
    visLScapeX: number;
    visLScapeY: number;
    visLScapeWidth: number;
    visLScapeHeight: number;
    totalLScapeWidth: number;
    totalLScapeHeight: number;
    firstFrame: number;
    lastFrame: number;
    frameCount: number;
    playDirection: number;
}

export class LivingService {
    private scene: Scene;
    private imageService: ImageService;
    private sc: SpriteControl | null = null;

    constructor(scene: Scene, imageService: ImageService) {
        this.scene = scene;
        this.imageService = imageService;
    }

    /**
     * Initialize the living system
     */
    async init(
        visLScapeX: number,
        visLScapeY: number,
        visLScapeWidth: number,
        visLScapeHeight: number,
        totalLScapeWidth: number,
        totalLScapeHeight: number,
        frameCount: number,
        startArea: number
    ): Promise<void> {
        this.sc = {
            livings: new Map(),
            templates: new Map(),
            sprPlayMode: PlayMode.NORMAL,
            activAreaId: startArea,
            visLScapeX,
            visLScapeY,
            visLScapeWidth,
            visLScapeHeight,
            totalLScapeWidth,
            totalLScapeHeight,
            firstFrame: 0,
            lastFrame: frameCount,
            frameCount,
            playDirection: 1
        };

        await this.loadTemplates();
        await this.loadLivings();
        this.setPlayMode(PlayMode.NORMAL);
    }

    /**
     * Cleanup
     */
    done(): void {
        if (!this.sc) return;

        // Destroy all sprites
        for (const living of this.sc.livings.values()) {
            if (living.sprite) {
                living.sprite.destroy();
            }
        }

        this.sc.livings.clear();
        this.sc.templates.clear();
        this.sc = null;
    }

    /**
     * Set active area ID
     */
    setActivAreaId(areaId: number): void {
        if (this.sc) {
            this.sc.activAreaId = areaId;
        }
    }

    /**
     * Set which area a living lives in
     */
    livesInArea(name: string, areaId: number): void {
        const living = this.getLiving(name);
        if (living) {
            living.livesInAreaId = areaId;
        }
    }

    /**
     * Get the area ID where a living is
     */
    whereIs(name: string): number {
        const living = this.getLiving(name);
        return living ? living.livesInAreaId : 0;
    }

    /**
     * Set position of a living
     */
    setPos(name: string, xPos: number, yPos: number): void {
        const living = this.getLiving(name);
        if (living) {
            living.xPos = xPos;
            living.yPos = yPos;
            
            if (living.sprite) {
                living.sprite.setPosition(xPos, yPos);
            }
        }
    }

    /**
     * Get X position of a living
     */
    getXPos(name: string): number {
        const living = this.getLiving(name);
        return living ? living.xPos : 0;
    }

    /**
     * Get Y position of a living
     */
    getYPos(name: string): number {
        const living = this.getLiving(name);
        return living ? living.yPos : 0;
    }

    /**
     * Set all livings to invisible
     */
    setAllInvisible(): void {
        if (!this.sc) return;

        for (const living of this.sc.livings.values()) {
            this.hide(living);
        }
    }

    /**
     * Refresh all livings (redraw)
     */
    refreshAll(): void {
        this.doAnims(false, false);
    }

    /**
     * Set play mode (normal or reverse)
     */
    setPlayMode(playMode: PlayMode): void {
        if (!this.sc) return;

        this.sc.sprPlayMode = playMode;

        if (playMode & PlayMode.NORMAL) {
            this.sc.firstFrame = 0;
            this.sc.lastFrame = this.sc.frameCount;
            this.sc.playDirection = 1;
        }

        if (playMode & PlayMode.REVERSE) {
            this.sc.firstFrame = this.sc.frameCount - 1;
            this.sc.lastFrame = -1;
            this.sc.playDirection = -1;
        }
    }

    /**
     * Animate a living
     */
    animate(name: string, action: AnimAction, xSpeed: number, ySpeed: number): void {
        const living = this.getLiving(name);
        if (!living || !this.sc) return;

        living.status = LivingStatus.ENABLED;
        living.oldAction = living.action;
        living.action = action;
        living.xSpeed = xSpeed;
        living.ySpeed = ySpeed;

        if (living.currFrameNr === this.sc.lastFrame) {
            living.currFrameNr = this.sc.firstFrame;
        }
    }

    /**
     * Turn a living on or off
     */
    turn(name: string, status: LivingStatus): void {
        const living = this.getLiving(name);
        if (living) {
            living.status = status;
        }
    }

    /**
     * Stop all livings
     */
    stopAll(): void {
        if (!this.sc) return;

        for (const living of this.sc.livings.values()) {
            if (living.status === LivingStatus.ENABLED) {
                this.animate(living.name, AnimAction.STAND, 0, 0);
            }
        }
    }

    /**
     * Get old action of a living
     */
    getOldAction(name: string): AnimAction {
        const living = this.getLiving(name);
        return living ? living.oldAction : AnimAction.STAND;
    }

    /**
     * Get view direction of a living
     */
    getViewDirection(name: string): number {
        const living = this.getLiving(name);
        return living ? living.viewDirection : 0;
    }

    /**
     * Set visible landscape position
     */
    setVisLScape(visLScapeX: number, visLScapeY: number): void {
        if (!this.sc) return;

        this.sc.visLScapeX = visLScapeX;
        this.sc.visLScapeY = visLScapeY;
    }

    /**
     * Prepare animations (called before rendering)
     */
    prepareAnims(): void {
        // In the web version, this is handled by Phaser
        // Original C code copied surface pixels to buffer
    }

    /**
     * Do animations (update and render)
     */
    doAnims(play: boolean, move: boolean): void {
        if (!this.sc) return;

        for (const living of this.sc.livings.values()) {
            if (this.isVisible(living)) {
                this.show(living);
                
                if (play && living.status === LivingStatus.ENABLED) {
                    // Update animation frame
                    living.currFrameNr += this.sc.playDirection;
                    
                    if (this.sc.playDirection > 0 && living.currFrameNr >= this.sc.lastFrame) {
                        living.currFrameNr = this.sc.firstFrame;
                    } else if (this.sc.playDirection < 0 && living.currFrameNr <= this.sc.lastFrame) {
                        living.currFrameNr = this.sc.firstFrame;
                    }
                }
                
                if (move && living.status === LivingStatus.ENABLED) {
                    // Update position
                    living.xPos += living.xSpeed;
                    living.yPos += living.ySpeed;
                    
                    if (living.sprite) {
                        living.sprite.setPosition(living.xPos, living.yPos);
                    }
                }
            } else {
                this.hide(living);
            }
        }
    }

    /**
     * Get a living by name
     */
    private getLiving(name: string): Living | undefined {
        return this.sc?.livings.get(name);
    }

    /**
     * Check if a living is visible
     */
    private isVisible(living: Living): boolean {
        if (!this.sc) return false;
        
        // Check if living is in active area
        if (living.livesInAreaId !== this.sc.activAreaId) {
            return false;
        }

        // Check if living is within visible landscape bounds
        const inBounds = 
            living.xPos >= this.sc.visLScapeX &&
            living.xPos < this.sc.visLScapeX + this.sc.visLScapeWidth &&
            living.yPos >= this.sc.visLScapeY &&
            living.yPos < this.sc.visLScapeY + this.sc.visLScapeHeight;

        return inBounds;
    }

    /**
     * Hide a living
     */
    private hide(living: Living): void {
        if (living.sprite) {
            living.sprite.setVisible(false);
        }
    }

    /**
     * Show a living
     */
    private show(living: Living): void {
        if (living.sprite) {
            living.sprite.setVisible(true);
        }
    }

    /**
     * Load animation templates from TEMPLATE.LST
     */
    private async loadTemplates(): Promise<void> {
        if (!this.sc) return;

        try {
            const response = await fetch('../gamedata/TEXTS/TEMPLATE.LST');
            const text = await response.text();
            const lines = text.split('\n').filter(line => line.trim() && !line.startsWith(';'));

            for (const line of lines) {
                const parts = line.split(',').map(p => p.trim());
                if (parts.length >= 4) {
                    const name = parts[0];
                    const width = parseInt(parts[1]);
                    const height = parseInt(parts[2]);
                    const frameOffsetNr = parseInt(parts[3]);

                    this.sc.templates.set(name, {
                        name,
                        width,
                        height,
                        frameOffsetNr
                    });

                    console.log(`Loaded animation template: ${name} (${width}x${height}, offset: ${frameOffsetNr})`);
                }
            }
        } catch (error) {
            console.error('Failed to load animation templates:', error);
        }
    }

    /**
     * Load livings (characters) from LIVINGS.LST
     */
    private async loadLivings(): Promise<void> {
        if (!this.sc) return;

        try {
            const response = await fetch('../gamedata/TEXTS/LIVINGS.LST');
            const text = await response.text();
            const lines = text.split('\n').filter(line => line.trim() && !line.startsWith(';'));

            for (const line of lines) {
                const parts = line.split(',').map(p => p.trim());
                if (parts.length >= 6) {
                    const name = parts[0];
                    const templateName = parts[1];
                    const xSize = parseInt(parts[2]);
                    const ySize = parseInt(parts[3]);
                    const xSpeed = parseInt(parts[4]);
                    const ySpeed = parseInt(parts[5]);

                    this.addLiving(name, templateName, xSize, ySize, xSpeed, ySpeed);
                    console.log(`Loaded living: ${name} using template ${templateName}`);
                }
            }
        } catch (error) {
            console.error('Failed to load livings:', error);
        }
    }

    /**
     * Add a living
     */
    private addLiving(
        name: string,
        templateName: string,
        xSize: number,
        ySize: number,
        xSpeed: number,
        ySpeed: number
    ): void {
        if (!this.sc) return;

        const template = this.sc.templates.get(templateName);
        if (!template) {
            console.warn(`Template ${templateName} not found`);
            return;
        }

        const living: Living = {
            name,
            livesInAreaId: 0,
            livingNr: this.sc.livings.size,
            originTemplate: template,
            xSize,
            ySize,
            xSpeed,
            ySpeed,
            xPos: 0,
            yPos: 0,
            viewDirection: 0,
            action: AnimAction.STAND,
            oldAction: AnimAction.STAND,
            currFrameNr: 0,
            status: LivingStatus.DISABLED
        };

        // Create Phaser sprite
        // TODO: Load actual sprite texture
        // For now, create a placeholder rectangle
        const graphics = this.scene.add.graphics();
        graphics.fillStyle(0xff0000, 1);
        graphics.fillRect(0, 0, xSize, ySize);
        graphics.generateTexture(`living_${name}`, xSize, ySize);
        graphics.destroy();

        living.sprite = this.scene.add.sprite(0, 0, `living_${name}`);
        living.sprite.setVisible(false);

        this.sc.livings.set(name, living);
    }
}
