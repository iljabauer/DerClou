/**
 * Loot Service - Port of loot management functions
 * 
 * Handles loot collection, tracking, and value calculation.
 * Port of tcMakeLootList and related functions from src/scenes/dealer.c
 */

import { Database } from '../core/Database';
import { Loot, CompleteLoot } from '../types/GameTypes';
import { TextService } from './TextService';
import { CompleteLoot_LastLoot } from '../types/GameConstants';

export interface LootSummary {
    bild: number;
    gold: number;
    geld: number;
    juwelen: number;
    delikates: number;
    statue: number;
    kuriositaet: number;
    histKunst: number;
    gebrauchsArt: number;
    vase: number;
    totalWeight: number;
    totalVolume: number;
    totalValue: number;
}

export class LootService {
    private database: Database;
    private textService: TextService | null = null;

    constructor(database: Database) {
        this.database = database;
    }

    setTextService(textService: TextService): void {
        this.textService = textService;
    }

    /**
     * Create a loot list and calculate totals
     * Port of tcMakeLootList from src/scenes/dealer.c
     * 
     * @param containerId Container object ID (person, building, etc.)
     * @param relationId Relation ID (e.g., 'has')
     * @returns Loot summary with totals
     */
    makeLootList(containerId: number, relationId: string): LootSummary {
        // Get CompleteLoot object for tracking
        const completeLoot = this.database.getObject(
            CompleteLoot_LastLoot
        ) as CompleteLoot;

        if (!completeLoot) {
            console.warn('CompleteLoot_LastLoot not found');
            return this.createEmptySummary();
        }

        // Initialize totals
        const summary: LootSummary = this.createEmptySummary();

        // Get all loot items related to container
        const lootItems = this.database.getRelatedObjects(
            containerId,
            relationId,
            'Loot'
        );

        // Process each loot item
        for (const lootRef of lootItems) {
            const loot = this.database.getObject(lootRef.id) as Loot;
            if (!loot) continue;

            // Get value from relation (stored as relation data)
            // In C code: value = GetP(dbGetObject(containerID), relID, loot);
            // For now, use loot's base value
            const value = loot.value || 0;

            // Categorize by loot type
            switch (loot.type) {
                case 0: // Ein_Bild (painting)
                    summary.bild += value;
                    break;
                case 1: // Gold
                    summary.gold += value;
                    break;
                case 2: // Geld (money)
                    summary.geld += value;
                    break;
                case 3: // Juwelen (jewels)
                    summary.juwelen += value;
                    break;
                case 4: // Delikates (delicacies)
                    summary.delikates += value;
                    break;
                case 5: // Statue
                    summary.statue += value;
                    break;
                case 6: // Kuriositaet (curiosity)
                    summary.kuriositaet += value;
                    break;
                case 7: // HistKunst (historical art)
                    summary.histKunst += value;
                    break;
                case 8: // GebrauchsArt (utility art)
                    summary.gebrauchsArt += value;
                    break;
                case 9: // Vase
                    summary.vase += value;
                    break;
            }

            // Add weight and volume
            summary.totalWeight += loot.weight || 0;
            summary.totalVolume += loot.volume || 0;
        }

        // Calculate total value
        summary.totalValue = 
            summary.bild +
            summary.gold +
            summary.geld +
            summary.juwelen +
            summary.delikates +
            summary.statue +
            summary.kuriositaet +
            summary.histKunst +
            summary.gebrauchsArt +
            summary.vase;

        // Update CompleteLoot object
        completeLoot.bild = summary.bild;
        completeLoot.gold = summary.gold;
        completeLoot.geld = summary.geld;
        completeLoot.juwelen = summary.juwelen;
        completeLoot.delikates = summary.delikates;
        completeLoot.statue = summary.statue;
        completeLoot.kuriositaet = summary.kuriositaet;
        completeLoot.histKunst = summary.histKunst;
        completeLoot.gebrauchsArt = summary.gebrauchsArt;
        completeLoot.vase = summary.vase;
        completeLoot.totalWeight = summary.totalWeight;
        completeLoot.totalVolume = summary.totalVolume;

        return summary;
    }

    /**
     * Get loot summary for a container
     */
    getLootSummary(containerId: number, relationId: string = 'has'): LootSummary {
        return this.makeLootList(containerId, relationId);
    }

    /**
     * Get total loot value for a container
     */
    getTotalLootValue(containerId: number, relationId: string = 'has'): number {
        const summary = this.makeLootList(containerId, relationId);
        return summary.totalValue;
    }

    /**
     * Get total loot weight for a container
     */
    getTotalLootWeight(containerId: number, relationId: string = 'has'): number {
        const summary = this.makeLootList(containerId, relationId);
        return summary.totalWeight;
    }

    /**
     * Get total loot volume for a container
     */
    getTotalLootVolume(containerId: number, relationId: string = 'has'): number {
        const summary = this.makeLootList(containerId, relationId);
        return summary.totalVolume;
    }

    /**
     * Check if container has any loot
     */
    hasLoot(containerId: number, relationId: string = 'has'): boolean {
        const lootItems = this.database.getRelatedObjects(
            containerId,
            relationId,
            'Loot'
        );
        return lootItems.length > 0;
    }

    /**
     * Get loot count for a container
     */
    getLootCount(containerId: number, relationId: string = 'has'): number {
        const lootItems = this.database.getRelatedObjects(
            containerId,
            relationId,
            'Loot'
        );
        return lootItems.length;
    }

    /**
     * Transfer loot from one container to another
     */
    transferLoot(
        fromContainerId: number,
        toContainerId: number,
        lootId: number,
        relationId: string = 'has'
    ): boolean {
        // Check if source has the loot
        const hasLoot = this.database.hasRelation(
            fromContainerId,
            relationId,
            lootId
        );

        if (!hasLoot) {
            return false;
        }

        // Remove from source
        this.database.removeRelation(fromContainerId, relationId, lootId);

        // Add to destination
        this.database.addRelation(toContainerId, relationId, lootId);

        return true;
    }

    /**
     * Transfer all loot from one container to another
     */
    transferAllLoot(
        fromContainerId: number,
        toContainerId: number,
        relationId: string = 'has'
    ): number {
        const lootItems = this.database.getRelatedObjects(
            fromContainerId,
            relationId,
            'Loot'
        );

        let transferred = 0;
        for (const lootRef of lootItems) {
            if (this.transferLoot(fromContainerId, toContainerId, lootRef.id, relationId)) {
                transferred++;
            }
        }

        return transferred;
    }

    /**
     * Create empty loot summary
     */
    private createEmptySummary(): LootSummary {
        return {
            bild: 0,
            gold: 0,
            geld: 0,
            juwelen: 0,
            delikates: 0,
            statue: 0,
            kuriositaet: 0,
            histKunst: 0,
            gebrauchsArt: 0,
            vase: 0,
            totalWeight: 0,
            totalVolume: 0,
            totalValue: 0
        };
    }

    /**
     * Format loot summary as text
     */
    formatLootSummary(summary: LootSummary): string[] {
        const lines: string[] = [];

        if (summary.bild > 0) lines.push(`Paintings: ${summary.bild}`);
        if (summary.gold > 0) lines.push(`Gold: ${summary.gold}`);
        if (summary.geld > 0) lines.push(`Money: ${summary.geld}`);
        if (summary.juwelen > 0) lines.push(`Jewels: ${summary.juwelen}`);
        if (summary.delikates > 0) lines.push(`Delicacies: ${summary.delikates}`);
        if (summary.statue > 0) lines.push(`Statues: ${summary.statue}`);
        if (summary.kuriositaet > 0) lines.push(`Curiosities: ${summary.kuriositaet}`);
        if (summary.histKunst > 0) lines.push(`Historical Art: ${summary.histKunst}`);
        if (summary.gebrauchsArt > 0) lines.push(`Utility Art: ${summary.gebrauchsArt}`);
        if (summary.vase > 0) lines.push(`Vases: ${summary.vase}`);

        lines.push('');
        lines.push(`Total Value: ${summary.totalValue}`);
        lines.push(`Total Weight: ${summary.totalWeight}`);
        lines.push(`Total Volume: ${summary.totalVolume}`);

        return lines;
    }
}
