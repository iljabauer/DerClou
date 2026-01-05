
import { Scene } from 'phaser';
import { Services } from './Services';

declare const nw: any;

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

                // Create BitmapFont config
                // Phaser 3 RetroFont / BitmapFont from Grid
                // We can parse the font metrics manually or use Phaser's RetroFont helper.
                // RetroFont is for monospaced fonts in a grid.
                // The font image is 320px wide.
                // Chars per row: 320 / charWidth.

                const config = {
                    image: textureKey,
                    width: charWidth,
                    height: charHeight,
                    chars: '',
                    charsPerRow: Math.floor(width / charWidth),
                    spacing: { x: 0, y: 0 },
                    offset: { x: 0, y: 0 }
                };

                // Generate chars string
                // The font contains chars from 0? or from firstChar?
                // The C code says `uch_FirstChar = 32`.
                // But the image is 320x36. 320/5 = 64. 36/9 = 4. 64*4 = 256.
                // So the image contains 256 characters (0-255).
                // We need to map them.

                // Phaser RetroFont expects a string of characters in order.
                // We can construct it.
                let chars = '';
                for (let i = 0; i < 256; i++) {
                    // We can use a special char for unprintable?
                    // Or just use the unicode char if possible.
                    if (i < 32) chars += ' '; // Placeholder
                    else chars += String.fromCharCode(i);
                }
                config.chars = chars;

                // However, Phaser.GameObjects.RetroFont is a Game Object, not a global font.
                // To register it globally, we use cache.bitmapFont?
                // Phaser.GameObjects.RetroFont.Parse(this, config);
                // This adds it to the cache.

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
