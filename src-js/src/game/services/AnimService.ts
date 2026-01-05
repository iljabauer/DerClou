
import { Services } from './Services';

declare const nw: any;
declare const process: any;

interface PictEntry {
    pictId: number;
    collId: number;
    xOffset: number;
    yOffset: number;
    width: number;
    height: number;
    destX: number;
    destY: number;
}

interface CollEntry {
    collId: number;
    filename: string;
    width: number;
    height: number;
}

export class AnimService {
    private picts: Map<number, PictEntry> = new Map();
    private colls: Map<number, CollEntry> = new Map();
    private hasLoaded: boolean = false;

    async loadData() {
        if (this.hasLoaded) return;

        if (typeof nw !== 'undefined') {
            await this.loadFromDisk();
        }
        this.hasLoaded = true;
    }

    private async loadFromDisk() {
        const fs = nw.require('fs');
        const path = nw.require('path');

        let rootDir = process.cwd();
        if (!fs.existsSync(path.join(rootDir, 'gamedata'))) {
             rootDir = path.join(rootDir, '..');
        }

        const textsDir = path.join(rootDir, 'gamedata', 'TEXTS');

        // Load PICT.LST
        this.loadPictList(fs.readFileSync(path.join(textsDir, 'PICT.LST'), 'latin1'));

        // Load COLL.LST
        this.loadCollList(fs.readFileSync(path.join(textsDir, 'COLL.LST'), 'latin1'));
    }

    private loadPictList(content: string) {
        const lines = content.split(/\r?\n/);
        for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.length === 0 || trimmed.startsWith(';')) continue;
            const parts = trimmed.split(',').map(s => parseInt(s.trim()));
            if (parts.length >= 2) {
                // PictId, CollId, XOffset, YOffset, Width, Height, DestX, DestY
                this.picts.set(parts[0], {
                    pictId: parts[0],
                    collId: parts[1],
                    xOffset: parts[2] || 0,
                    yOffset: parts[3] || 0,
                    width: parts[4] || 0,
                    height: parts[5] || 0,
                    destX: parts[6] || 0,
                    destY: parts[7] || 0
                });
            }
        }
    }

    private loadCollList(content: string) {
        const lines = content.split(/\r?\n/);
        for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.length === 0 || trimmed.startsWith(';')) continue;
            // CSV: CollId, Filename, Width, Height, ...
            const parts = trimmed.split(',').map(s => s.trim());
            if (parts.length >= 4) {
                const id = parseInt(parts[0]);
                this.colls.set(id, {
                    collId: id,
                    filename: parts[1],
                    width: parseInt(parts[2]),
                    height: parseInt(parts[3])
                });
            }
        }
    }

    getBackgroundForLocation(locationName: string): { filename: string, pict: PictEntry } | null {
        // Prepare key: replace , with _
        const key = locationName.replace(/,/g, '_');

        // Get ANIM text
        const animData = Services.text.getText("ANIM", key);
        if (!animData || animData.length === 0) {
            console.warn(`No ANIM text for ${key}`);
            return null;
        }

        const line = animData[0];
        const parts = line.split(',').map(s => s.trim());

        // Ensure we have enough parts
        if (parts.length < 3) return null;

        const pictId = parseInt(parts[2]); // Index 2 (3rd element)

        const pict = this.picts.get(pictId);
        if (!pict) {
            console.warn(`Pict ID ${pictId} not found`);
            return null;
        }

        const coll = this.colls.get(pict.collId);
        if (!coll) {
            console.warn(`Coll ID ${pict.collId} not found`);
            return null;
        }

        return { filename: coll.filename, pict };
    }
}
