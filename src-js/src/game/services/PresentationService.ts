/**
 * Presentation Service - Port of src/present/present.c
 * 
 * Handles displaying game objects (persons, buildings, tools, etc.)
 * with their properties in a formatted way.
 */

import { Scene } from 'phaser';
import { Database } from '../core/Database';
import { Person, Building, Tool, Car, Loot } from '../types/GameTypes';
import { TextService } from './TextService';
import { ImageService } from './ImageService';

export enum PresentMode {
    TEXT = 1,
    BAR = 2,
    NUMBER = 3
}

export interface PresentationLine {
    label: string;
    mode: PresentMode;
    value: number;
    maxValue: number;
    text?: string;
}

export class PresentationService {
    private scene: Scene;
    private database: Database;
    private textService: TextService | null = null;
    private imageService: ImageService | null = null;

    constructor(scene: Scene, database: Database) {
        this.scene = scene;
        this.database = database;
    }

    setTextService(textService: TextService): void {
        this.textService = textService;
    }

    setImageService(imageService: ImageService): void {
        this.imageService = imageService;
    }

    /**
     * Present a person object
     */
    presentPerson(personId: number): PresentationLine[] {
        const person = this.database.getObject(personId) as Person;
        if (!person) {
            return [];
        }

        const lines: PresentationLine[] = [];

        // Name
        lines.push({
            label: 'Name',
            mode: PresentMode.TEXT,
            value: 0,
            maxValue: 0,
            text: person.name
        });

        // Known
        if (person.known !== undefined) {
            lines.push({
                label: 'Known',
                mode: PresentMode.BAR,
                value: person.known,
                maxValue: 255
            });
        }

        // Mood
        if (person.mood !== undefined) {
            lines.push({
                label: 'Mood',
                mode: PresentMode.BAR,
                value: person.mood,
                maxValue: 255
            });
        }

        return lines;
    }

    /**
     * Present a building object
     */
    presentBuilding(buildingId: number): PresentationLine[] {
        const building = this.database.getObject(buildingId) as Building;
        if (!building) {
            return [];
        }

        const lines: PresentationLine[] = [];

        // Name
        lines.push({
            label: 'Name',
            mode: PresentMode.TEXT,
            value: 0,
            maxValue: 0,
            text: building.name
        });

        // Exact name
        if (building.exactName) {
            lines.push({
                label: 'Location',
                mode: PresentMode.TEXT,
                value: 0,
                maxValue: 0,
                text: building.exactName
            });
        }

        // Strike
        if (building.strike !== undefined) {
            lines.push({
                label: 'Strike',
                mode: PresentMode.BAR,
                value: building.strike,
                maxValue: 255
            });
        }

        // Police
        if (building.police !== undefined) {
            lines.push({
                label: 'Police',
                mode: PresentMode.BAR,
                value: building.police,
                maxValue: 255
            });
        }

        return lines;
    }

    /**
     * Present a tool object
     */
    presentTool(toolId: number): PresentationLine[] {
        const tool = this.database.getObject(toolId) as Tool;
        if (!tool) {
            return [];
        }

        const lines: PresentationLine[] = [];

        // Name
        lines.push({
            label: 'Name',
            mode: PresentMode.TEXT,
            value: 0,
            maxValue: 0,
            text: tool.name
        });

        // Type
        if (tool.type !== undefined) {
            lines.push({
                label: 'Type',
                mode: PresentMode.NUMBER,
                value: tool.type,
                maxValue: 0
            });
        }

        return lines;
    }

    /**
     * Present a car object
     */
    presentCar(carId: number): PresentationLine[] {
        const car = this.database.getObject(carId) as Car;
        if (!car) {
            return [];
        }

        const lines: PresentationLine[] = [];

        // Name
        lines.push({
            label: 'Name',
            mode: PresentMode.TEXT,
            value: 0,
            maxValue: 0,
            text: car.name
        });

        // Speed
        if (car.speed !== undefined) {
            lines.push({
                label: 'Speed',
                mode: PresentMode.BAR,
                value: car.speed,
                maxValue: 255
            });
        }

        return lines;
    }

    /**
     * Present a loot object
     */
    presentLoot(lootId: number): PresentationLine[] {
        const loot = this.database.getObject(lootId) as Loot;
        if (!loot) {
            return [];
        }

        const lines: PresentationLine[] = [];

        // Name
        lines.push({
            label: 'Name',
            mode: PresentMode.TEXT,
            value: 0,
            maxValue: 0,
            text: loot.name
        });

        // Weight
        if (loot.weight !== undefined) {
            lines.push({
                label: 'Weight',
                mode: PresentMode.NUMBER,
                value: loot.weight,
                maxValue: 0
            });
        }

        // Volume
        if (loot.volume !== undefined) {
            lines.push({
                label: 'Volume',
                mode: PresentMode.NUMBER,
                value: loot.volume,
                maxValue: 0
            });
        }

        return lines;
    }

    /**
     * Draw presentation lines on screen
     */
    drawPresentation(
        lines: PresentationLine[],
        x: number,
        y: number,
        width: number
    ): Phaser.GameObjects.Container {
        const container = this.scene.add.container(x, y);
        const lineHeight = 20;
        const barWidth = 150;
        const barHeight = 12;

        lines.forEach((line, index) => {
            const yPos = index * lineHeight;

            // Label
            const label = this.scene.add.text(0, yPos, line.label + ':', {
                fontFamily: 'Arial',
                fontSize: '14px',
                color: '#ffffff'
            });
            container.add(label);

            // Value
            switch (line.mode) {
                case PresentMode.TEXT:
                    if (line.text) {
                        const text = this.scene.add.text(120, yPos, line.text, {
                            fontFamily: 'Arial',
                            fontSize: '14px',
                            color: '#ffff00'
                        });
                        container.add(text);
                    }
                    break;

                case PresentMode.BAR:
                    // Background bar
                    const bgBar = this.scene.add.rectangle(
                        120, yPos + barHeight / 2,
                        barWidth, barHeight,
                        0x333333
                    );
                    bgBar.setOrigin(0, 0.5);
                    container.add(bgBar);

                    // Value bar
                    const percent = line.maxValue > 0 ? line.value / line.maxValue : 0;
                    const valueBar = this.scene.add.rectangle(
                        120, yPos + barHeight / 2,
                        barWidth * percent, barHeight,
                        0x00ff00
                    );
                    valueBar.setOrigin(0, 0.5);
                    container.add(valueBar);

                    // Percentage text
                    const percentText = this.scene.add.text(
                        120 + barWidth / 2, yPos,
                        `${Math.round(percent * 100)}%`,
                        {
                            fontFamily: 'Arial',
                            fontSize: '12px',
                            color: '#ffffff'
                        }
                    );
                    percentText.setOrigin(0.5, 0);
                    container.add(percentText);
                    break;

                case PresentMode.NUMBER:
                    const number = this.scene.add.text(120, yPos, line.value.toString(), {
                        fontFamily: 'Arial',
                        fontSize: '14px',
                        color: '#ffff00'
                    });
                    container.add(number);
                    break;
            }
        });

        return container;
    }

    /**
     * Present any object by ID
     */
    presentObject(objectId: number): PresentationLine[] {
        const obj = this.database.getObject(objectId);
        if (!obj) {
            return [];
        }

        // Determine object type and present accordingly
        const type = obj.type;
        
        switch (type) {
            case 'Person':
                return this.presentPerson(objectId);
            case 'Building':
                return this.presentBuilding(objectId);
            case 'Tool':
                return this.presentTool(objectId);
            case 'Car':
                return this.presentCar(objectId);
            case 'Loot':
                return this.presentLoot(objectId);
            default:
                // Generic presentation
                return [{
                    label: 'Name',
                    mode: PresentMode.TEXT,
                    value: 0,
                    maxValue: 0,
                    text: obj.name || 'Unknown'
                }];
        }
    }
}
