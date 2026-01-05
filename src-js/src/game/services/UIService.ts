/**
 * UI Service - Port of src/present/interac.c
 * 
 * Handles menus, bubbles, and user interaction.
 * Simplified for web/Phaser environment.
 */

export const GET_OUT = 255;
export const MENU_TIMEOUT = 254;

export interface MenuItem {
    text: string;
    enabled: boolean;
    data?: any;
}

export interface MenuOptions {
    items: MenuItem[];
    activeIndex?: number;
    onSelect?: (index: number) => void;
    onChange?: (index: number) => void;
    timeout?: number;
    onTimeout?: () => void;
}

export interface BubbleOptions {
    lines: string[];
    activeIndex?: number;
    onSelect?: (index: number) => void;
    onChange?: (index: number) => void;
    timeout?: number;
    pictureId?: number;
    bubbleType?: 'speak' | 'think';
}

export class UIService {
    private scene: Phaser.Scene;
    private menuContainer: Phaser.GameObjects.Container | null = null;
    private bubbleContainer: Phaser.GameObjects.Container | null = null;
    private currentMenu: MenuOptions | null = null;
    private currentBubble: BubbleOptions | null = null;
    private activeIndex: number = 0;
    private timeoutTimer: Phaser.Time.TimerEvent | null = null;

    // Colors
    private readonly ACTIVE_COLOR = 0xffff00;
    private readonly INACTIVE_COLOR = 0xcccccc;
    private readonly BG_COLOR = 0x000000;
    private readonly BORDER_COLOR = 0x888888;

    // Layout
    private readonly MENU_Y = 550;
    private readonly MENU_SPACING = 8;
    private readonly BUBBLE_X = 112;
    private readonly BUBBLE_Y = 50;
    private readonly BUBBLE_WIDTH = 600;
    private readonly BUBBLE_HEIGHT = 400;
    private readonly BUBBLE_LINE_HEIGHT = 20;
    private readonly BUBBLE_MAX_LINES = 5;

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
    }

    /**
     * Show a menu with selectable options
     */
    showMenu(options: MenuOptions): Promise<number> {
        return new Promise((resolve) => {
            this.currentMenu = options;
            this.activeIndex = options.activeIndex || 0;

            // Find first enabled item
            while (this.activeIndex < options.items.length && !options.items[this.activeIndex].enabled) {
                this.activeIndex++;
            }

            if (this.activeIndex >= options.items.length) {
                resolve(GET_OUT);
                return;
            }

            // Create menu container
            this.menuContainer = this.scene.add.container(0, this.MENU_Y);

            // Draw menu items in two rows
            let x = 10;
            const items = options.items;
            
            for (let i = 0; i < items.length; i++) {
                const item = items[i];
                const row = i % 2;
                const y = row * 20;

                const text = this.scene.add.text(x, y, item.text, {
                    fontFamily: 'Arial',
                    fontSize: '16px',
                    color: item.enabled ? '#cccccc' : '#666666'
                });

                text.setData('index', i);
                this.menuContainer.add(text);

                if (item.enabled) {
                    text.setInteractive({ useHandCursor: true });
                    text.on('pointerover', () => {
                        if (this.currentMenu) {
                            this.setActiveMenuItem(i);
                        }
                    });
                    text.on('pointerdown', () => {
                        if (this.currentMenu) {
                            this.selectMenuItem(i, resolve);
                        }
                    });
                }

                // Move to next column after every 2 items
                if (row === 1) {
                    x += Math.max(
                        this.scene.add.text(0, 0, items[i - 1]?.text || '', { fontSize: '16px' }).width,
                        text.width
                    ) + this.MENU_SPACING;
                }
            }

            // Highlight active item
            this.updateMenuHighlight();

            // Setup keyboard controls
            const cursors = this.scene.input.keyboard?.createCursorKeys();
            if (cursors) {
                const keyHandler = (event: KeyboardEvent) => {
                    if (!this.currentMenu) return;

                    if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
                        this.moveMenuSelection(-1);
                    } else if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
                        this.moveMenuSelection(1);
                    } else if (event.key === 'Enter' || event.key === ' ') {
                        this.selectMenuItem(this.activeIndex, resolve);
                    } else if (event.key === 'Escape') {
                        this.closeMenu();
                        resolve(GET_OUT);
                    }
                };

                this.scene.input.keyboard?.on('keydown', keyHandler);
                this.scene.events.once('shutdown', () => {
                    this.scene.input.keyboard?.off('keydown', keyHandler);
                });
            }

            // Setup timeout
            if (options.timeout && options.timeout > 0) {
                this.timeoutTimer = this.scene.time.delayedCall(options.timeout, () => {
                    if (options.onTimeout) {
                        options.onTimeout();
                    }
                    this.closeMenu();
                    resolve(MENU_TIMEOUT);
                });
            }

            // Call initial onChange
            if (options.onChange) {
                options.onChange(this.activeIndex);
            }
        });
    }

    /**
     * Show a bubble dialog with text lines
     */
    showBubble(options: BubbleOptions): Promise<number> {
        return new Promise((resolve) => {
            this.currentBubble = options;
            this.activeIndex = options.activeIndex || 0;

            // Create bubble container
            this.bubbleContainer = this.scene.add.container(this.BUBBLE_X, this.BUBBLE_Y);

            // Draw bubble background
            const bg = this.scene.add.rectangle(
                0, 0,
                this.BUBBLE_WIDTH, this.BUBBLE_HEIGHT,
                this.BG_COLOR, 0.9
            );
            bg.setStrokeStyle(2, this.BORDER_COLOR);
            bg.setOrigin(0, 0);
            this.bubbleContainer.add(bg);

            // Calculate visible range
            const firstVisible = Math.max(0, this.activeIndex - this.BUBBLE_MAX_LINES + 1);
            const visibleLines = options.lines.slice(firstVisible, firstVisible + this.BUBBLE_MAX_LINES);

            // Draw lines
            for (let i = 0; i < visibleLines.length; i++) {
                const lineIndex = firstVisible + i;
                const isActive = lineIndex === this.activeIndex;
                
                const text = this.scene.add.text(
                    10, 10 + i * this.BUBBLE_LINE_HEIGHT,
                    visibleLines[i],
                    {
                        fontFamily: 'Arial',
                        fontSize: '16px',
                        color: isActive ? '#ffff00' : '#cccccc'
                    }
                );

                text.setData('index', lineIndex);
                this.bubbleContainer.add(text);

                text.setInteractive({ useHandCursor: true });
                text.on('pointerover', () => {
                    if (this.currentBubble) {
                        this.setActiveBubbleLine(lineIndex);
                    }
                });
                text.on('pointerdown', () => {
                    if (this.currentBubble) {
                        this.selectBubbleLine(lineIndex, resolve);
                    }
                });
            }

            // Setup keyboard controls
            const keyHandler = (event: KeyboardEvent) => {
                if (!this.currentBubble) return;

                if (event.key === 'ArrowUp') {
                    this.moveBubbleSelection(-1);
                } else if (event.key === 'ArrowDown') {
                    this.moveBubbleSelection(1);
                } else if (event.key === 'Enter' || event.key === ' ') {
                    this.selectBubbleLine(this.activeIndex, resolve);
                } else if (event.key === 'Escape') {
                    this.closeBubble();
                    resolve(GET_OUT);
                }
            };

            this.scene.input.keyboard?.on('keydown', keyHandler);
            this.scene.events.once('shutdown', () => {
                this.scene.input.keyboard?.off('keydown', keyHandler);
            });

            // Setup timeout
            if (options.timeout && options.timeout > 0) {
                this.timeoutTimer = this.scene.time.delayedCall(options.timeout, () => {
                    this.closeBubble();
                    resolve(GET_OUT);
                });
            }

            // Call initial onChange
            if (options.onChange) {
                options.onChange(this.activeIndex);
            }
        });
    }

    /**
     * Move menu selection
     */
    private moveMenuSelection(delta: number): void {
        if (!this.currentMenu) return;

        let newIndex = this.activeIndex;
        const items = this.currentMenu.items;

        // Find next enabled item
        do {
            newIndex += delta;
            if (newIndex < 0) newIndex = items.length - 1;
            if (newIndex >= items.length) newIndex = 0;
        } while (!items[newIndex].enabled && newIndex !== this.activeIndex);

        if (newIndex !== this.activeIndex) {
            this.setActiveMenuItem(newIndex);
        }
    }

    /**
     * Set active menu item
     */
    private setActiveMenuItem(index: number): void {
        if (!this.currentMenu || !this.menuContainer) return;

        this.activeIndex = index;
        this.updateMenuHighlight();

        if (this.currentMenu.onChange) {
            this.currentMenu.onChange(index);
        }
    }

    /**
     * Update menu highlight
     */
    private updateMenuHighlight(): void {
        if (!this.menuContainer) return;

        this.menuContainer.iterate((child: Phaser.GameObjects.GameObject) => {
            if (child instanceof Phaser.GameObjects.Text) {
                const index = child.getData('index');
                const isActive = index === this.activeIndex;
                child.setColor(isActive ? '#ffff00' : '#cccccc');
            }
        });
    }

    /**
     * Select menu item
     */
    private selectMenuItem(index: number, resolve: (value: number) => void): void {
        if (!this.currentMenu) return;

        if (this.currentMenu.onSelect) {
            this.currentMenu.onSelect(index);
        }

        this.closeMenu();
        resolve(index);
    }

    /**
     * Close menu
     */
    private closeMenu(): void {
        if (this.menuContainer) {
            this.menuContainer.destroy();
            this.menuContainer = null;
        }
        if (this.timeoutTimer) {
            this.timeoutTimer.destroy();
            this.timeoutTimer = null;
        }
        this.currentMenu = null;
    }

    /**
     * Move bubble selection
     */
    private moveBubbleSelection(delta: number): void {
        if (!this.currentBubble) return;

        let newIndex = this.activeIndex + delta;
        if (newIndex < 0) newIndex = 0;
        if (newIndex >= this.currentBubble.lines.length) {
            newIndex = this.currentBubble.lines.length - 1;
        }

        if (newIndex !== this.activeIndex) {
            this.setActiveBubbleLine(newIndex);
        }
    }

    /**
     * Set active bubble line
     */
    private setActiveBubbleLine(index: number): void {
        if (!this.currentBubble) return;

        this.activeIndex = index;
        
        // Redraw bubble with new active line
        this.closeBubble();
        this.showBubble(this.currentBubble);

        if (this.currentBubble.onChange) {
            this.currentBubble.onChange(index);
        }
    }

    /**
     * Select bubble line
     */
    private selectBubbleLine(index: number, resolve: (value: number) => void): void {
        if (!this.currentBubble) return;

        if (this.currentBubble.onSelect) {
            this.currentBubble.onSelect(index);
        }

        this.closeBubble();
        resolve(index);
    }

    /**
     * Close bubble
     */
    private closeBubble(): void {
        if (this.bubbleContainer) {
            this.bubbleContainer.destroy();
            this.bubbleContainer = null;
        }
        if (this.timeoutTimer) {
            this.timeoutTimer.destroy();
            this.timeoutTimer = null;
        }
        this.currentBubble = null;
    }

    /**
     * Cleanup
     */
    destroy(): void {
        this.closeMenu();
        this.closeBubble();
    }
}
