/**
 * Cars Service - Port of src/scenes/cars.c
 * 
 * Handles car buying, selling, and garage services at Marc Smith's dealership.
 */

import { Scene } from 'phaser';
import { Database } from '../core/Database';
import { Car, Person } from '../types/GameTypes';
import { TextService } from './TextService';
import { UIService } from './UIService';
import { DialogService } from './DialogService';
import { FilmService } from './FilmService';
import { Person_Matt_Stuvysunt, Person_Marc_Smith, Car_Jaguar_XK_1950 } from '../types/GameConstants';

export class CarsService {
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
     * Get car price
     */
    private getCarPrice(car: Car): number {
        // Base price from car value
        return car.value;
    }

    /**
     * Get car trader offer (sell price)
     */
    private getCarTraderOffer(car: Car): number {
        // Trader offers based on condition and age
        const baseValue = car.value;
        const condition = car.state / 255;
        const age = this.getCarAge(car);
        
        // Depreciation: 10% per year
        const depreciation = Math.max(0, 1 - (age * 0.1));
        
        return Math.floor(baseValue * condition * depreciation * 0.6);
    }

    /**
     * Get car age in years
     */
    private getCarAge(car: Car): number {
        // TODO: Calculate based on current game date and car purchase date
        return 0;
    }

    /**
     * Get car value (current worth)
     */
    private getCarValue(car: Car): number {
        const baseValue = car.value;
        const condition = car.state / 255;
        const age = this.getCarAge(car);
        
        // Depreciation: 10% per year
        const depreciation = Math.max(0, 1 - (age * 0.1));
        
        return Math.floor(baseValue * condition * depreciation);
    }

    /**
     * Spend money
     */
    private spendMoney(amount: number, silent: boolean = false): boolean {
        const player = this.database.getObject(Person_Matt_Stuvysunt) as Person;
        if (!player) return false;

        if (player.money >= amount) {
            player.money -= amount;
            return true;
        }

        if (!silent) {
            this.dialogService.say('BUSINESS_TXT', 'NO_MONEY', Person_Matt_Stuvysunt);
        }
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
     * Get player money
     */
    private getPlayerMoney(): number {
        const player = this.database.getObject(Person_Matt_Stuvysunt) as Person;
        return player ? player.money : 0;
    }

    /**
     * Format car price for display
     */
    private showPriceOfCar(car: Car): string {
        const template = this.textService.getFirstLine('BUSINESS_TXT', 'PRICE_AND_MONEY');
        const price = this.getCarPrice(car);
        return template.replace('%d', price.toString());
    }

    /**
     * Buy car menu
     * Port of tcBuyCar()
     */
    async buyCar(): Promise<void> {
        const marc = this.database.getObject(Person_Marc_Smith) as Person;
        if (!marc) return;

        let choice1 = 0;

        while (choice1 !== 2) {
            // Get all cars Marc has
            const cars = this.database.getRelated(Person_Marc_Smith, 'has', 'Car');
            
            if (cars.length === 0) {
                await this.dialogService.say('BUSINESS_TXT', 'NO_CAR', marc.pictId);
                break;
            }

            // Sort cars by name
            cars.sort((a, b) => {
                const carA = this.database.getObject(a) as Car;
                const carB = this.database.getObject(b) as Car;
                return (carA?.name || '').localeCompare(carB?.name || '');
            });

            // Build menu with prices
            const menuItems: string[] = [];
            for (const carId of cars) {
                const car = this.database.getObject(carId) as Car;
                if (car) {
                    const price = this.getCarPrice(car);
                    menuItems.push(`${car.name} - £${price}`);
                }
            }

            // Add "Thanks" option
            const thanksText = this.textService.getFirstLine('BUSINESS_TXT', 'THANKS');
            menuItems.push(thanksText);

            // Show menu
            const choice = await this.uiService.showMenu(menuItems, 0);

            if (choice === -1 || choice === menuItems.length - 1) {
                // Exit or "Thanks" selected
                break;
            }

            const carId = cars[choice];
            const car = this.database.getObject(carId) as Car;
            if (!car) continue;

            // TODO: Show car image with colors
            // SetCarColors(car.colorIndex);
            // gfxShow(car.pictId, ...);

            // TODO: Present car details
            // Present(carId, "Car", InitCarPresent);

            // Ask if player wants to buy
            choice1 = await this.dialogService.say('BUSINESS_TXT', 'AUTOKAUF', Person_Matt_Stuvysunt);

            // Add time
            this.filmService.addTime(7);

            if (choice1 === 1) {
                const price = this.getCarPrice(car);

                if (this.spendMoney(price)) {
                    // Transfer car from Marc to Matt
                    this.database.removeRelation(Person_Marc_Smith, carId, 'has');
                    this.database.addRelation(Person_Matt_Stuvysunt, carId, 'has');

                    await this.dialogService.say('BUSINESS_TXT', 'GOOD CAR', marc.pictId);
                }

                // Ask if player wants to continue
                if (await this.dialogService.say('BUSINESS_TXT', 'NACH_AUTOKAUF', Person_Matt_Stuvysunt) === 1) {
                    choice1 = 2;
                }
            }
        }
    }

    /**
     * Sell car menu
     * Port of tcSellCar()
     */
    async sellCar(carId: number): Promise<void> {
        const marc = this.database.getObject(Person_Marc_Smith) as Person;
        if (!marc) return;

        const car = this.database.getObject(carId) as Car;
        if (!car) return;

        const offer = this.getCarTraderOffer(car);
        const value = this.getCarValue(car);
        const age = this.getCarAge(car);

        // Show offer
        let offerText: string;
        if (age < 1) {
            offerText = this.textService.getFirstLine('BUSINESS_TXT', 'ANGEBOT_1');
            offerText = offerText.replace('%d', value.toString()).replace('%d', offer.toString());
        } else {
            offerText = this.textService.getFirstLine('BUSINESS_TXT', 'ANGEBOT');
            offerText = offerText.replace('%d', value.toString())
                .replace('%d', age.toString())
                .replace('%d', offer.toString());
        }

        await this.uiService.showBubble([offerText], 'say', marc.pictId);

        // Ask for confirmation
        const choice = await this.dialogService.say('BUSINESS_TXT', 'VERKAUF', Person_Matt_Stuvysunt);

        if (choice === 0) {
            // Sell the car
            this.addPlayerMoney(offer);
            this.database.removeRelation(Person_Matt_Stuvysunt, carId, 'has');
            this.database.addRelation(Person_Marc_Smith, carId, 'has');
        }

        // Add time
        this.filmService.addTime(97);
    }

    /**
     * Choose a car from player's collection
     * Port of tcChooseCar()
     */
    async chooseCar(backgroundNr: number = 0): Promise<number> {
        // Get all cars Matt has
        const cars = this.database.getRelated(Person_Matt_Stuvysunt, 'has', 'Car');
        
        if (cars.length === 0) {
            return 0;
        }

        // Sort cars by name
        cars.sort((a, b) => {
            const carA = this.database.getObject(a) as Car;
            const carB = this.database.getObject(b) as Car;
            return (carA?.name || '').localeCompare(carB?.name || '');
        });

        let carId = 0;

        if (cars.length === 1) {
            // Only one car, select it automatically
            carId = cars[0];
        } else {
            // Multiple cars, show menu
            const menuItems: string[] = [];
            for (const id of cars) {
                const car = this.database.getObject(id) as Car;
                if (car) {
                    menuItems.push(car.name);
                }
            }

            // Add "No choice" option
            const noChoiceText = this.textService.getFirstLine('BUSINESS_TXT', 'NO_CHOICE');
            menuItems.push(noChoiceText);

            await this.dialogService.say('BUSINESS_TXT', 'ES GEHT UM..', Person_Matt_Stuvysunt);

            const choice = await this.uiService.showMenu(menuItems, 0);

            if (choice !== -1 && choice !== menuItems.length - 1) {
                carId = cars[choice];
            }
        }

        if (carId !== 0) {
            const car = this.database.getObject(carId) as Car;
            if (car) {
                // TODO: Show car image with colors
                // SetCarColors(car.colorIndex);
                // gfxShow(backgroundNr, ...);
                // gfxShow(car.pictId, ...);
            }
        }

        return carId;
    }

    /**
     * Garage menu for car maintenance
     * Port of tcCarInGarage()
     */
    async carInGarage(carId: number): Promise<void> {
        const marc = this.database.getObject(Person_Marc_Smith) as Person;
        if (!marc) return;

        const car = this.database.getObject(carId) as Car;
        if (!car) return;

        let choice = 0;

        while (choice !== 5) {
            // Show garage menu
            const menuText = this.textService.getTextLines('BUSINESS_TXT', 'GARAGE');
            choice = await this.uiService.showMenu(menuText, choice);

            if (choice === -1) {
                choice = 5;
                break;
            }

            switch (choice) {
                case 0: // General overhaul
                    await this.carGeneralOverhaul(car);
                    break;

                case 1: // Body repair
                    await this.repairCar(car, 'BodyRepair');
                    break;

                case 2: // Tyre repair
                    await this.repairCar(car, 'TyreRepair');
                    break;

                case 3: // Motor repair
                    await this.repairCar(car, 'MotorRepair');
                    break;

                case 4: // Color change
                    if (carId !== Car_Jaguar_XK_1950) {
                        await this.colorCar(car);
                    } else {
                        await this.dialogService.say('BUSINESS_TXT', 'JAGUAR_COLOR', marc.pictId);
                    }
                    break;

                default:
                    break;
            }
        }
    }

    /**
     * Repair car
     * Port of tcRepairCar()
     */
    private async repairCar(car: Car, repairType: string): Promise<void> {
        // TODO: Full implementation with animation and progress
        console.log(`[CarsService] Repair car: ${repairType}`);
        
        // Stub: Just restore car to full condition
        car.motorState = 255;
        car.bodyWorkState = 255;
        car.tyreState = 255;
        car.state = 255;
    }

    /**
     * Color car
     * Port of tcColorCar()
     */
    private async colorCar(car: Car): Promise<void> {
        const marc = this.database.getObject(Person_Marc_Smith) as Person;
        if (!marc) return;

        // Calculate costs
        const costs = Math.floor(car.value * 0.1); // 10% of car value

        // Show costs
        const costsText = this.textService.getFirstLine('BUSINESS_TXT', 'LACKIEREN');
        const message = costsText.replace('%d', costs.toString());
        await this.uiService.showBubble([message], 'say', marc.pictId);

        // Ask for confirmation
        const choice = await this.dialogService.say('BUSINESS_TXT', 'LACKIEREN_ANT', Person_Matt_Stuvysunt);

        if (choice === 0) {
            if (this.spendMoney(costs)) {
                // Get color list
                const colors = this.textService.getTextLines('OBJECTS_ENUM_TXT', 'enum_ColorE');
                
                // Add "No choice" option
                const noChoiceText = this.textService.getFirstLine('BUSINESS_TXT', 'NO_CHOICE');
                colors.push(noChoiceText);

                // Show color menu
                const colorChoice = await this.uiService.showMenu(colors, car.colorIndex);

                if (colorChoice !== -1 && colorChoice !== colors.length - 1) {
                    car.colorIndex = colorChoice;

                    // TODO: Show repainting animation
                    // PlayAnim("Umlackieren", 3000, ...);
                }
            }
        }

        // Add time
        this.filmService.addTime(137);
    }

    /**
     * General overhaul
     * Port of tcCarGeneralOverhoul()
     */
    private async carGeneralOverhaul(car: Car): Promise<void> {
        const marc = this.database.getObject(Person_Marc_Smith) as Person;
        if (!marc) return;

        // Calculate costs (full repair)
        const costs = Math.floor(car.value * 0.3); // 30% of car value

        // Show costs
        const costsText = this.textService.getFirstLine('BUSINESS_TXT', 'GENERAL_OVERHOUL');
        const message = costsText.replace('%d', costs.toString());
        await this.uiService.showBubble([message], 'say', marc.pictId);

        // Ask for confirmation
        const choice = await this.dialogService.say('BUSINESS_TXT', 'GENERAL_OVERHOUL_QUEST', Person_Matt_Stuvysunt);

        if (choice === 0) {
            await this.repairCar(car, 'TotalRepair');
        }
    }
}
