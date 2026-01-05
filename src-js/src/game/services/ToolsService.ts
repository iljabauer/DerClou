/**
 * Tools Service - Port of src/scenes/tools.c
 * 
 * Handles tool buying, selling, and viewing at Mary Bolton's shop.
 */

import { Scene } from 'phaser';
import { Database } from '../core/Database';
import { Tool, Person } from '../types/GameTypes';
import { TextService } from './TextService';
import { UIService } from './UIService';
import { DialogService } from './DialogService';
import { FilmService } from './FilmService';
import { Person_Matt_Stuvysunt, Person_Mary_Bolton, Tool_Hand, Tool_Fusz } from '../types/GameConstants';

export class ToolsService {
    private scene: Scene;
    private database: Database;
    private textService: TextService;
    private uiService: UIService;
    private dialogService: DialogService;
    private filmService: FilmService;

    constructor(
        scene: Scene,
        database: Database,
        textService: TextService,
        uiService: UIService,
        dialogService: DialogService,
        filmService: FilmService
    ) {
        this.scene = scene;
        this.database = database;
        this.textService = textService;
        this.uiService = uiService;
        this.dialogService = dialogService;
        this.filmService = filmService;
    }

    /**
     * Get tool price
     */
    private getToolPrice(tool: Tool): number {
        return tool.value;
    }

    /**
     * Get tool trader offer (sell price)
     */
    private getToolTraderOffer(tool: Tool): number {
        // Trader offers 50% of value
        return Math.floor(tool.value / 2);
    }

    /**
     * Spend money
     */
    private spendMoney(amount: number): boolean {
        const player = this.database.getObject(Person_Matt_Stuvysunt) as Person;
        if (!player) return false;

        if (player.money >= amount) {
            player.money -= amount;
            return true;
        }

        // Not enough money
        this.dialogService.say('BUSINESS_TXT', 'NO_MONEY', Person_Matt_Stuvysunt);
        return false;
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
     * Format tool price for display
     */
    private showPriceOfTool(tool: Tool): string {
        const template = this.textService.getFirstLine('BUSINESS_TXT', 'PRICE_AND_MONEY');
        return template.replace('%d', tool.value.toString());
    }

    /**
     * Buy tool menu
     * Port of tcBuyTool()
     */
    async buyTool(initialChoice: number = 0): Promise<number> {
        const mary = this.database.getObject(Person_Mary_Bolton) as Person;
        if (!mary) return 0;

        // Get all tools Mary has
        const tools = this.database.getRelated(Person_Mary_Bolton, 'has', 'Tool');
        if (tools.length === 0) {
            await this.dialogService.say('BUSINESS_TXT', 'NO_TOOLS', mary.pictId);
            return 0;
        }

        // Sort tools by name
        tools.sort((a, b) => {
            const toolA = this.database.getObject(a) as Tool;
            const toolB = this.database.getObject(b) as Tool;
            return (toolA?.name || '').localeCompare(toolB?.name || '');
        });

        // Build menu with prices
        const menuItems: string[] = [];
        for (const toolId of tools) {
            const tool = this.database.getObject(toolId) as Tool;
            if (tool) {
                const price = this.getToolPrice(tool);
                menuItems.push(`${tool.name} - £${price}`);
            }
        }

        // Add "Thanks" option
        const thanksText = this.textService.getFirstLine('BUSINESS_TXT', 'THANKS');
        menuItems.push(thanksText);

        let choice = Math.min(initialChoice, menuItems.length - 1);
        let oldChoice = choice;

        while (true) {
            // Show menu
            choice = await this.uiService.showMenu(menuItems, choice);

            if (choice === -1 || choice === menuItems.length - 1) {
                // Exit or "Thanks" selected
                break;
            }

            oldChoice = choice;
            const toolId = tools[choice];
            const tool = this.database.getObject(toolId) as Tool;
            if (!tool) continue;

            const price = this.getToolPrice(tool);

            // Check if Matt already has this tool
            if (this.database.hasRelation(Person_Matt_Stuvysunt, toolId, 'has')) {
                await this.dialogService.say('BUSINESS_TXT', 'AUSVERKAUFT', mary.pictId);
                continue;
            }

            // Try to buy
            if (this.spendMoney(price)) {
                // Transfer tool from Mary to Matt
                this.database.removeRelation(Person_Mary_Bolton, toolId, 'has');
                this.database.addRelation(Person_Matt_Stuvysunt, toolId, 'has');

                await this.dialogService.say('BUSINESS_TXT', 'GOOD TOOL', mary.pictId);
            }
        }

        return oldChoice;
    }

    /**
     * Describe tool menu
     * Port of tcDescTool()
     */
    async describeTool(initialChoice: number = 0): Promise<number> {
        const mary = this.database.getObject(Person_Mary_Bolton) as Person;
        if (!mary) return 0;

        // Get all tools Mary has
        const tools = this.database.getRelated(Person_Mary_Bolton, 'has', 'Tool');
        if (tools.length === 0) {
            await this.dialogService.say('BUSINESS_TXT', 'NO_TOOLS', mary.pictId);
            return 0;
        }

        // Sort tools by name
        tools.sort((a, b) => {
            const toolA = this.database.getObject(a) as Tool;
            const toolB = this.database.getObject(b) as Tool;
            return (toolA?.name || '').localeCompare(toolB?.name || '');
        });

        // Build menu with prices
        const menuItems: string[] = [];
        for (const toolId of tools) {
            const tool = this.database.getObject(toolId) as Tool;
            if (tool) {
                const price = this.getToolPrice(tool);
                menuItems.push(`${tool.name} - £${price}`);
            }
        }

        // Add "Thanks" option
        const thanksText = this.textService.getFirstLine('BUSINESS_TXT', 'THANKS');
        menuItems.push(thanksText);

        let choice = Math.min(initialChoice, menuItems.length - 1);
        let oldChoice = choice;

        while (true) {
            // Show menu
            choice = await this.uiService.showMenu(menuItems, choice);

            if (choice === -1 || choice === menuItems.length - 1) {
                // Exit or "Thanks" selected
                break;
            }

            oldChoice = choice;
            const toolId = tools[choice];
            const tool = this.database.getObject(toolId) as Tool;
            if (!tool) continue;

            // Get tool description from TOOLS_TXT
            const description = this.textService.getTextLines('TOOLS_TXT', tool.name);
            if (description.length > 0) {
                await this.uiService.showBubble(description, 'say', mary.pictId);
            }
        }

        return oldChoice;
    }

    /**
     * Show tool details menu
     * Port of tcShowTool()
     */
    async showTool(initialChoice: number = 0): Promise<number> {
        const mary = this.database.getObject(Person_Mary_Bolton) as Person;
        if (!mary) return 0;

        // Get all tools Mary has
        const tools = this.database.getRelated(Person_Mary_Bolton, 'has', 'Tool');
        if (tools.length === 0) {
            await this.dialogService.say('BUSINESS_TXT', 'NO_TOOLS', mary.pictId);
            return 0;
        }

        // Sort tools by name
        tools.sort((a, b) => {
            const toolA = this.database.getObject(a) as Tool;
            const toolB = this.database.getObject(b) as Tool;
            return (toolA?.name || '').localeCompare(toolB?.name || '');
        });

        // Build menu with prices
        const menuItems: string[] = [];
        for (const toolId of tools) {
            const tool = this.database.getObject(toolId) as Tool;
            if (tool) {
                const price = this.getToolPrice(tool);
                menuItems.push(`${tool.name} - £${price}`);
            }
        }

        // Add "Thanks" option
        const thanksText = this.textService.getFirstLine('BUSINESS_TXT', 'THANKS');
        menuItems.push(thanksText);

        let choice = Math.min(initialChoice, menuItems.length - 1);
        let oldChoice = choice;

        while (true) {
            // Show menu
            choice = await this.uiService.showMenu(menuItems, choice);

            if (choice === -1 || choice === menuItems.length - 1) {
                // Exit or "Thanks" selected
                break;
            }

            oldChoice = choice;
            const toolId = tools[choice];

            // Show tool details using presentation system
            // TODO: Implement Present() function for tools
            console.log(`[ToolsService] Show tool details for ${toolId}`);
        }

        return oldChoice;
    }

    /**
     * Sell tool menu
     * Port of tcSellTool()
     */
    async sellTool(): Promise<void> {
        const mary = this.database.getObject(Person_Mary_Bolton) as Person;
        if (!mary) return;

        // Get all tools Matt has (except Hand and Fusz)
        let tools = this.database.getRelated(Person_Matt_Stuvysunt, 'has', 'Tool');
        tools = tools.filter(id => id !== Tool_Hand && id !== Tool_Fusz);

        if (tools.length === 0) {
            await this.dialogService.say('BUSINESS_TXT', 'MATT_HAS_NO_TOOL', Person_Matt_Stuvysunt);
            return;
        }

        while (tools.length > 0) {
            // Sort tools by name
            tools.sort((a, b) => {
                const toolA = this.database.getObject(a) as Tool;
                const toolB = this.database.getObject(b) as Tool;
                return (toolA?.name || '').localeCompare(toolB?.name || '');
            });

            // Build menu
            const menuItems: string[] = [];
            for (const toolId of tools) {
                const tool = this.database.getObject(toolId) as Tool;
                if (tool) {
                    menuItems.push(tool.name);
                }
            }

            // Add "No choice" option
            const noChoiceText = this.textService.getFirstLine('BUSINESS_TXT', 'NO_CHOICE');
            menuItems.push(noChoiceText);

            // Show menu
            const choice = await this.uiService.showMenu(menuItems, 0);

            if (choice === -1 || choice === menuItems.length - 1) {
                // Exit or "No choice" selected
                break;
            }

            const toolId = tools[choice];
            const tool = this.database.getObject(toolId) as Tool;
            if (!tool) continue;

            const price = this.getToolTraderOffer(tool);

            // Show offer
            const offerText = this.textService.getFirstLine('BUSINESS_TXT', 'ANGEBOT_WERKZ');
            const offerMessage = offerText.replace('%d', price.toString());
            await this.uiService.showBubble([offerMessage], 'say', mary.pictId);

            // Ask for confirmation
            const confirmText = this.textService.getTextLines('BUSINESS_TXT', 'VERKAUF');
            const confirmChoice = await this.uiService.showMenu(confirmText, 0);

            if (confirmChoice === 0) {
                // Sell the tool
                this.addPlayerMoney(price);
                this.database.removeRelation(Person_Matt_Stuvysunt, toolId, 'has');
                this.database.addRelation(Person_Mary_Bolton, toolId, 'has');
            }

            // Refresh tool list
            tools = this.database.getRelated(Person_Matt_Stuvysunt, 'has', 'Tool');
            tools = tools.filter(id => id !== Tool_Hand && id !== Tool_Fusz);
        }
    }

    /**
     * Main tools shop menu
     * Port of tcToolsShop()
     */
    async toolsShop(): Promise<void> {
        // Make sure Matt knows Mary
        if (!this.database.hasRelation(Person_Matt_Stuvysunt, Person_Mary_Bolton, 'knows')) {
            this.database.addRelation(Person_Matt_Stuvysunt, Person_Mary_Bolton, 'knows');
        }

        let choice = 0;
        let subChoice = 0;

        while (choice !== 4) {
            // Show main menu
            const menuText = this.textService.getTextLines('BUSINESS_TXT', 'Tools Shop');
            choice = await this.uiService.showMenu(menuText, choice);

            if (choice === -1) {
                choice = 4;
                break;
            }

            switch (choice) {
                case 0: // Buy
                    subChoice = await this.buyTool(subChoice);
                    if (subChoice === -1) subChoice = 0;
                    break;

                case 1: // Sell
                    await this.sellTool();
                    break;

                case 2: // Show
                    subChoice = await this.showTool(subChoice);
                    if (subChoice === -1) subChoice = 0;
                    break;

                case 3: // Describe
                    subChoice = await this.describeTool(subChoice);
                    if (subChoice === -1) subChoice = 0;
                    break;

                default:
                    choice = 4;
                    break;
            }
        }
    }
}
