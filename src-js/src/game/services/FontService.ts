
import { Scene } from 'phaser';
import { Services } from './Services';

declare const nw: any;
declare const process: any;
declare const Buffer: any;

export class FontService {
    private hasLoaded: boolean = false;

    async loadFonts(scene: Scene) {
        if (this.hasLoaded) return;

        await this.loadFont(scene, 'menu', 'MENU.FNT', 5, 9, 32, 255, 320, 36);
        await this.loadFont(scene, 'bubble', 'BUBBLE.FNT', 4, 8, 32, 255, 320, 24);

        this.hasLoaded = true;
    }

    private async loadFont(scene: Scene, key: string, filename: string, charWidth: number, charHeight: number, firstChar: number, lastChar: number, width: number, height: number) {
        if (typeof nw === 'undefined') return;

        const path = nw.require('path');
        const fs = nw.require('fs');
        let rootDir = process.cwd();
        if (!fs.existsSync(path.join(rootDir, 'gamedata'))) {
            rootDir = path.join(rootDir, '..');
        }

        const filePath = path.join(rootDir, 'gamedata', 'PICTURES', filename);

        if (fs.existsSync(filePath)) {
            const iff = await Services.iff.loadIff(filePath);
            if (iff) {
                const textureKey = `font_${key}`;
                Services.iff.createTexture(scene, textureKey, iff);

                const config: any = {
                    image: textureKey,
                    width: charWidth,
                    height: charHeight,
                    chars: '',
                    charsPerRow: Math.floor(width / charWidth),
                    spacing: { x: 0, y: 0 },
                    offset: { x: 0, y: 0 },
                    lineSpacing: 0
                };

                let chars = '';
                for (let i = 0; i < 256; i++) {
                    if (i < 32) chars += ' ';
                    else chars += String.fromCharCode(i);
                }
                config.chars = chars;

                scene.cache.bitmapFont.add(key, Phaser.GameObjects.RetroFont.Parse(scene, config));
                console.log(`Loaded font: ${key}`);
            } else {
                console.error(`Failed to parse font IFF: ${filePath}`);
            }
        } else {
             console.error(`Font file not found: ${filePath}`);
        }
    }
}
