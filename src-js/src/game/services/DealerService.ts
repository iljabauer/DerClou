/**
 * Dealer Service - Port of src/scenes/dealer.c
 * 
 * Handles selling stolen loot to fences (Maloya, Pooly, Parker).
 */

import { Scene } from 'phaser';
import { Database } from '../core/Database';
import { Person, Loot, CompleteLoot } from '../types/GameTypes';
import { TextService } from './TextService';
import { UIService } from './UIService';
import { DialogService } from './DialogService';
import { FilmService } from './FilmService';
import { LootService } from './LootService';
import { Random } from './Random';
import {
    Person_Matt_Stuvysunt,
    Person_Frank_Maloya,
    Person_Eric_Pooly,
    Person_Helen_Parker,
    Location_Maloya,
    Location_Pooly,
    Location_Parker,
    CompleteLoot_LastLoot
} from '../types/GameConstants';

// Dealer price percentages for each loot type
// [Maloya, Pooly, Parker] x 10 loot types
const DEALER_PRICES = [
    // Maloya
    70, 150, 220, 90, 210, 110, 200, 0, 190, 80,
    // Pooly
    120, 200, 180, 220, 79, 110, 0, 0, 110, 200,
    // Parker
    220, 66, 0, 110, 0, 220, 0, 212, 20, 130
];

export class DealerService {
    private scene: Scene;
    private database: Database;
    private textService: TextService;
    private uiService: UIService;
    private dialogService: DialogService;
    private filmService: FilmService;
    private lootService: LootService;
    private random: Random;

    constructor(
        scene: Scene,
        database: Database,
        textService: TextService,
        uiService: UIService,
        dialogService: DialogService,
        filmService: FilmService,
        lootService: LootService,
        random: Random
    ) {
        this.scene = scene;
        this.database = database;
        this.textService = textService;
        this.uiService = uiService;
        this.dialogService = dialogService;
        this.filmService = filmService;
        this.lootService = lootService;
        this.random = random;
    }

    /**
     * Add money to player
     */
    private addPlayerMoney(amount: number): void {
        const player = this.database.getObject(Person_Matt_Stuvysunt) as Person;
        if (player) {
            player.money += amount;
        }
    }

    /**
     * Add randomness to price
     */
    private moreRandom(value: number): number {
        const r = this.random.calcRandomNr(0, Math.floor(value / 4) + 1) - Math.floor(value / 8);
        return Math.min(value + r, 250);
    }

    /**
     * Get dealer percentage for loot type
     */
    private getDealerPercentage(dealer: Person, basePerc: number): number {
        // TODO: Adjust based on dealer sympathy
        return basePerc;
    }

    /**
     * Calculate dealer offer
     */
    private getDealerOffer(price: number, percentage: number): number {
        return Math.floor((price * percentage) / 100);
    }

    /**
     * Add dealer sympathy
     */
    private addDealerSymp(dealer: Person, amount: number): void {
        // TODO: Implement sympathy system
        console.log(`[DealerService] Add sympathy ${amount} to dealer ${dealer.id}`);
    }

    /**
     * Main dealer dialog
     * Port of tcDealerDlg()
     */
    async dealerDialog(locationId: number): Promise<void> {
        let dealer: Person | null = null;
        let dealerNr = 0;

        // Determine which dealer based on location
        if (locationId === Location_Parker) {
            dealer = this.database.getObject(Person_Helen_Parker) as Person;
            this.database.addRelation(Person_Matt_Stuvysunt, Person_Helen_Parker, 'knows');
            dealerNr = 2;
        } else if (locationId === Location_Maloya) {
            dealer = this.database.getObject(Person_Frank_Maloya) as Person;
            this.database.addRelation(Person_Matt_Stuvysunt, Person_Frank_Maloya, 'knows');
            dealerNr = 0;
        } else if (locationId === Location_Pooly) {
            dealer = this.database.getObject(Person_Eric_Pooly) as Person;
            this.database.addRelation(Person_Matt_Stuvysunt, Person_Eric_Pooly, 'knows');
            dealerNr = 1;
        }

        if (!dealer) return;

        let choice = 0;

        while (choice !== 2 && choice !== -1) {
            // Show dealer menu
            choice = await this.dialogService.say('BUSINESS_TXT', 'DEALER_QUEST', Person_Matt_Stuvysunt);

            switch (choice) {
                case 0: // What do you deal in?
                    if (locationId === Location_Parker) {
                        await this.dialogService.say('BUSINESS_TXT', 'DEALER_PARKER', dealer.pictId);
                    } else if (locationId === Location_Maloya) {
                        await this.dialogService.say('BUSINESS_TXT', 'DEALER_MALOYA', dealer.pictId);
                    } else if (locationId === Location_Pooly) {
                        await this.dialogService.say('BUSINESS_TXT', 'DEALER_POOLY', dealer.pictId);
                    }
                    break;

                case 1: // Make offer
                    // Check if Matt has any loot
                    const loot = this.database.getRelated(Person_Matt_Stuvysunt, 'has', 'Loot');
                    
                    if (loot.length === 0) {
                        await this.dialogService.say('BUSINESS_TXT', 'NO_LOOT', dealer.pictId);
                        this.filmService.addTime(17);
                    } else {
                        await this.dealerOffer(dealer, dealerNr);
                    }
                    break;

                case 2:
                default:
                    break;
            }
        }

        this.filmService.addTime(11);
    }

    /**
     * Dealer makes offer for loot
     * Port of tcDealerOffer()
     */
    private async dealerOffer(dealer: Person, dealerNr: number): Promise<void> {
        // Get loot summary
        const summary = this.lootService.makeLootList(Person_Matt_Stuvysunt, 'has');

        // Make offers for each loot type
        const lootTypes = [
            { key: 'bild', index: 0 },
            { key: 'gold', index: 1 },
            { key: 'geld', index: 2 },
            { key: 'juwelen', index: 3 },
            { key: 'delikates', index: 4 },
            { key: 'statue', index: 5 },
            { key: 'kuriositaet', index: 6 },
            { key: 'histKunst', index: 7 },
            { key: 'gebrauchsArt', index: 8 },
            { key: 'vase', index: 9 }
        ];

        for (const lootType of lootTypes) {
            const value = (summary as any)[lootType.key];
            if (value > 0) {
                const basePrice = DEALER_PRICES[dealerNr * 10 + lootType.index];
                if (basePrice > 0) {
                    const randomPrice = this.moreRandom(basePrice);
                    await this.dealerSays(dealer, lootType.index, randomPrice);
                }
            }
        }
    }

    /**
     * Dealer makes specific offer
     * Port of tcDealerSays()
     */
    private async dealerSays(dealer: Person, lootTypeIndex: number, percentage: number): Promise<void> {
        if (percentage === 0) {
            // Dealer doesn't deal in this type
            const lootNames = this.textService.getTextLines('OBJECTS_ENUM_TXT', 'enum_LootE');
            const dealerText = this.textService.getTextLines('BUSINESS_TXT', 'DEALER_OFFER');
            
            const message = dealerText[4].replace('%s', lootNames[lootTypeIndex]);
            await this.uiService.showBubble([message, dealerText[5]], 'say', dealer.pictId);
            return;
        }

        // Get all loot items Matt has
        const lootIds = this.database.getRelated(Person_Matt_Stuvysunt, 'has', 'Loot');
        
        // Sort by name
        lootIds.sort((a, b) => {
            const lootA = this.database.getObject(a) as Loot;
            const lootB = this.database.getObject(b) as Loot;
            return (lootA?.name || '').localeCompare(lootB?.name || '');
        });

        const adjustedPerc = this.getDealerPercentage(dealer, percentage);
        const lootNames = this.textService.getTextLines('OBJECTS_ENUM_TXT', 'enum_LootE');
        const specialLootNames = this.textService.getTextLines('OBJECTS_ENUM_TXT', 'enum_LootNameE');
        const dealerText = this.textService.getTextLines('BUSINESS_TXT', 'DEALER_OFFER');

        // Process each loot item of this type
        for (const lootId of lootIds) {
            const loot = this.database.getObject(lootId) as Loot;
            if (!loot || loot.type !== lootTypeIndex) continue;

            // Get loot value
            const price = this.database.getRelationValue(Person_Matt_Stuvysunt, lootId, 'has') || loot.value;
            const offer = Math.max(this.getDealerOffer(price, adjustedPerc), 1);

            // Build offer message
            let message: string[];
            let sympathy: number;

            if (loot.name) {
                // Special named loot
                sympathy = 10;
                const lootName = specialLootNames[loot.name] || loot.name;
                message = [
                    dealerText[2].replace('%s', lootName),
                    dealerText[3].replace('%d', offer.toString())
                ];
            } else {
                // Regular loot
                sympathy = 1;
                const typeName = lootNames[lootTypeIndex];
                message = [
                    dealerText[0].replace('%s', typeName),
                    dealerText[1].replace('%d', price.toString()).replace('%d', offer.toString())
                ];
            }

            // Show offer
            await this.uiService.showBubble(message, 'say', dealer.pictId);

            // Ask if player wants to sell
            const choice = await this.dialogService.say('BUSINESS_TXT', 'DEALER_ANSWER', Person_Matt_Stuvysunt);

            if (choice === 0) {
                // Sell the loot
                this.database.removeRelation(Person_Matt_Stuvysunt, lootId, 'has');

                // Calculate Matt's share (TODO: get from player data)
                const mattsPart = 100; // 100% for now
                const mattsMoney = Math.max(Math.floor((offer * mattsPart) / 100), 1);

                this.addDealerSymp(dealer, sympathy);
                this.addPlayerMoney(mattsMoney);

                // TODO: Update player stolen money stats
                // player.stolenMoney += offer;
                // player.myStolenMoney += mattsMoney;

                // Reduce sympathy with other dealers
                const otherDealers = [
                    Person_Frank_Maloya,
                    Person_Eric_Pooly,
                    Person_Helen_Parker
                ].filter(id => id !== dealer.id);

                for (const otherId of otherDealers) {
                    const other = this.database.getObject(otherId) as Person;
                    if (other) {
                        this.addDealerSymp(other, -sympathy);
                    }
                }
            }
        }
    }
}
