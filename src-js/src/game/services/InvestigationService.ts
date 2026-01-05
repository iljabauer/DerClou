/**
 * Investigation system - Port of invest.c
 * Handles building observation and intelligence gathering
 */

import { Database } from '../core/Database';
import { GameState } from '../core/GameState';
import { TextService } from './TextService';
import { UIService } from './UIService';
import { Building } from '../types/GameTypes';
import { GameConstants } from './GameConstants';

// Text file IDs
const INVESTIGATIONS_TXT = 5;

// Constants
const MINUTES_PER_DAY = 1440;

interface InvestigationEvent {
    time: string;  // Format: "HH:MM"
    text: string;
}

export class InvestigationService {
    private db: Database;
    private gameState: GameState;
    private textService: TextService;
    private uiService: UIService;

    constructor(
        db: Database,
        gameState: GameState,
        textService: TextService,
        uiService: UIService
    ) {
        this.db = db;
        this.gameState = gameState;
        this.textService = textService;
        this.uiService = uiService;
    }

    /**
     * Main investigation function - Port of Investigate() from invest.c
     * Allows player to observe a building for 24 hours
     */
    async investigate(locationName: string): Promise<void> {
        const buildingId = this.getBuildingIdForLocation(this.gameState.currentLocation);
        if (!buildingId) {
            console.error('No building found for current location');
            return;
        }

        const building = this.db.getObject(buildingId) as Building;
        if (!building) {
            console.error('Building not found:', buildingId);
            return;
        }

        // Check for special case: Buckingham Palace (if Profidisk)
        // TODO: Check bProfidisk flag when implemented
        // if (buildingId === GameConstants.Building_Buckingham_Palace) {
        //     await this.showBuckinghamMessage();
        //     return;
        // }

        // Load investigation events for this location
        const events = this.loadInvestigationEvents(locationName);
        if (events.length === 0) {
            console.warn('No investigation events found for location:', locationName);
            return;
        }

        // Calculate patrol frequency based on guard rate
        const guardRate = building.gRate;
        const patrolCount = Math.floor((270 - guardRate) / 4) + 1;

        // Calculate knowledge gain per event
        // Formula: 255 / (patrols_per_day + other_events + 1) + 3
        const patrolsPerDay = Math.floor(MINUTES_PER_DAY / patrolCount);
        const raise = Math.floor(255 / (patrolsPerDay + events.length + 1)) + 3;

        // Mark that Matt has investigated this building
        this.db.addRelation(GameConstants.Person_Matt_Stuvysunt, buildingId, 'has');

        // Get investigation UI texts
        const cancelText = this.textService.getFirstLine(INVESTIGATIONS_TXT, 'Abbrechen');
        const patrolText = this.textService.getFirstLine(INVESTIGATIONS_TXT, 'Patrolie');

        // Start investigation loop
        let minutes = 0;
        let eventIndex = 0;
        let patrolCount_display = 0;
        let cancelled = false;

        // Wait until first event
        while (eventIndex === 0 && minutes < MINUTES_PER_DAY && !cancelled) {
            const currentTime = this.formatTime(this.gameState.currentMinute);

            // Check for patrol
            if (this.gameState.currentMinute % patrolCount === 0) {
                cancelled = await this.showPatrol(currentTime, patrolText, patrolCount_display++, building, raise);
                if (cancelled) break;
            }

            // Check for scheduled event
            if (events[eventIndex] && events[eventIndex].time === currentTime) {
                break;
            }

            // Random strike increase
            if (this.randomCheck(6)) {
                this.addBuildingStrike(building, 1);
            }

            // Advance time
            this.gameState.addTime(1);
            minutes++;
        }

        // Main observation loop
        while (minutes < MINUTES_PER_DAY && !cancelled) {
            const currentTime = this.formatTime(this.gameState.currentMinute);

            // Show time every hour
            if (this.gameState.currentMinute % 60 === 0) {
                // TODO: ShowTime(0) - update time display
            }

            // Check for patrol
            if (this.gameState.currentMinute % patrolCount === 0) {
                cancelled = await this.showPatrol(currentTime, patrolText, patrolCount_display++, building, raise);
                if (cancelled) break;
            }

            // Check for scheduled event
            if (events[eventIndex] && events[eventIndex].time === currentTime) {
                if (this.gameState.currentMinute % 60 !== 0) {
                    // TODO: ShowTime(0) - update time display
                }

                cancelled = await this.showEvent(events[eventIndex], patrolCount_display++, building, raise);
                if (cancelled) break;

                // Move to next event (wrap around)
                eventIndex = (eventIndex + 1) % events.length;
            }

            // Random strike increase
            if (this.randomCheck(6)) {
                this.addBuildingStrike(building, 1);
            }

            // Advance time
            this.gameState.addTime(1);
            minutes++;
        }

        // Show completion message if observed for 24 hours
        if (minutes >= MINUTES_PER_DAY) {
            const completionText = this.textService.getTextLines(INVESTIGATIONS_TXT, '24StundenBeobachtet');
            await this.uiService.showBubble(completionText, 'think', 0);
        }

        // TODO: Present building information
        // Present(buildingId, "Building", InitBuildingPresent);

        // TODO: ShowMenuBackground();
        // TODO: tcRefreshLocationInTitle(GetLocation);
        // TODO: ShowTime(0);
    }

    /**
     * Show patrol event
     */
    private async showPatrol(
        time: string,
        patrolText: string,
        displayCount: number,
        building: Building,
        raise: number
    ): Promise<boolean> {
        const message = `${time}  ${patrolText}`;
        const result = await this.uiService.showBubble([message], 'think', 140);

        this.addBuildingExactlyness(building, raise);

        return result.cancelled || false;
    }

    /**
     * Show investigation event
     */
    private async showEvent(
        event: InvestigationEvent,
        displayCount: number,
        building: Building,
        raise: number
    ): Promise<boolean> {
        const message = `${event.time}  ${event.text}`;
        const result = await this.uiService.showBubble([message], 'think', 140);

        this.addBuildingExactlyness(building, raise);

        return result.cancelled || false;
    }

    /**
     * Load investigation events from text file
     * Port of txtGoKey(INVESTIGATIONS_TXT, location)
     */
    private loadInvestigationEvents(locationName: string): InvestigationEvent[] {
        const lines = this.textService.getTextLines(INVESTIGATIONS_TXT, locationName);
        const events: InvestigationEvent[] = [];

        for (const line of lines) {
            // Each line should be in format "HH:MM  Event text"
            if (line.length >= 5 && line[2] === ':') {
                const time = line.substring(0, 5);
                const text = line.substring(5).trim();
                events.push({ time, text });
            }
        }

        return events;
    }

    /**
     * Format game time as HH:MM
     */
    private formatTime(minutes: number): string {
        const hours = Math.floor(minutes / 60) % 24;
        const mins = minutes % 60;
        return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
    }

    /**
     * Get building ID for a location
     */
    private getBuildingIdForLocation(locationId: number): number | null {
        // Find building with matching locationNr
        const buildings = this.db.getAllObjects().filter(obj => obj.type === 15); // ObjectType.Building
        for (const building of buildings) {
            const b = building as Building;
            if (b.locationNr === locationId) {
                return b.id;
            }
        }
        return null;
    }

    /**
     * Add to building exactlyness (knowledge/intelligence)
     * Port of tcAddBuildExactlyness macro
     */
    private addBuildingExactlyness(building: Building, value: number): void {
        building.exactlyness = this.changeAbs(building.exactlyness, value, 0, 255);
    }

    /**
     * Add to building strike (suspicion level)
     * Port of tcAddBuildStrike macro
     */
    private addBuildingStrike(building: Building, value: number): void {
        building.strike = this.changeAbs(building.strike, value, 0, 255);
    }

    /**
     * Change value within bounds
     * Port of ChangeAbs from C
     */
    private changeAbs(current: number, delta: number, min: number, max: number): number {
        let result = current + delta;
        if (result < min) result = min;
        if (result > max) result = max;
        return Math.floor(result);
    }

    /**
     * Random check - returns true with probability 1/max
     * Port of CalcRandomNrForGameLogic(0, max) == 1
     */
    private randomCheck(max: number): boolean {
        return Math.floor(Math.random() * (max + 1)) === 1;
    }

    /**
     * Show Buckingham Palace message (special case)
     */
    private async showBuckinghamMessage(): Promise<void> {
        const message = this.textService.getTextLines(INVESTIGATIONS_TXT, 'BuckinghamBeobachtet');
        await this.uiService.showBubble(message, 'think', 0);
    }
}
