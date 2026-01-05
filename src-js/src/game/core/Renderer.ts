/**
 * Basic rendering system for game UI
 */

import { Scene } from 'phaser';

export interface TextStyle {
    fontFamily?: string;
    fontSize?: string;
    color?: string;
    backgroundColor?: string;
    padding?: { x: number; y: number };
}

export class Renderer {
    private scene: Scene;
    private textObjects: Phaser.GameObjects.Text[] = [];
    private imageObjects: Phaser.GameObjects.Image[] = [];
    private graphicsObjects: Phaser.GameObjects.Graphics[] = [];

    constructor(scene: Scene) {
        this.scene = scene;
    }

    clear(): void {
        this.textObjects.forEach(obj => obj.destroy());
        this.imageObjects.forEach(obj => obj.destroy());
        this.graphicsObjects.forEach(obj => obj.destroy());
        this.textObjects = [];
        this.imageObjects = [];
        this.graphicsObjects = [];
    }

    drawText(x: number, y: number, text: string, style?: TextStyle): Phaser.GameObjects.Text {
        const defaultStyle = {
            fontFamily: 'Arial',
            fontSize: '16px',
            color: '#ffffff',
            ...style,
        };

        const textObj = this.scene.add.text(x, y, text, defaultStyle);
        this.textObjects.push(textObj);
        return textObj;
    }

    drawRect(x: number, y: number, width: number, height: number, color: number, alpha: number = 1): void {
        const graphics = this.scene.add.graphics();
        graphics.fillStyle(color, alpha);
        graphics.fillRect(x, y, width, height);
        this.graphicsObjects.push(graphics);
    }

    drawRectOutline(x: number, y: number, width: number, height: number, color: number, lineWidth: number = 2): void {
        const graphics = this.scene.add.graphics();
        graphics.lineStyle(lineWidth, color);
        graphics.strokeRect(x, y, width, height);
        this.graphicsObjects.push(graphics);
    }

    drawImage(x: number, y: number, key: string): Phaser.GameObjects.Image | null {
        try {
            const image = this.scene.add.image(x, y, key);
            this.imageObjects.push(image);
            return image;
        } catch (e) {
            console.warn(`Failed to draw image: ${key}`, e);
            return null;
        }
    }

    drawButton(
        x: number,
        y: number,
        text: string,
        callback: () => void,
        style?: TextStyle
    ): Phaser.GameObjects.Text {
        const defaultStyle = {
            fontFamily: 'Arial',
            fontSize: '18px',
            color: '#ffffff',
            backgroundColor: '#004400',
            padding: { x: 10, y: 5 },
            ...style,
        };

        const button = this.scene.add.text(x, y, text, defaultStyle)
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', callback);

        this.textObjects.push(button);
        return button;
    }

    drawMenu(x: number, y: number, items: string[], callback: (index: number) => void): void {
        items.forEach((item, index) => {
            this.drawButton(x, y + index * 40, item, () => callback(index));
        });
    }
}
