/**
 * Gameplay Service - Port of gp.c
 * Handles gameplay calculations, alarms, and detection
 * 
 * This service contains all the gameplay logic functions from gp.c:
 * - Alarm detection (time clocks, loudness, patrol, microphone, radio, touch, power)
 * - Guard detection
 * - Team mood calculation
 * - Tool usage time calculation
 * - Danger calculation
 * - Watchdog warnings
 */

import { Database } from '../core/Database';
import { Building, LSObject, Person } from '../types/GameTypes';

export class GameplayService {
    constructor(
        private db: Database
    ) {}

    /**
     * Check time clock alarms
     * Port of tcCheckTimeClocks() from dataappl.c
     * 
     * Checks if any time clocks in the building have been triggered.
     * Should be called every second (every 3 ticks).
     * Returns true if alarm should be triggered.
     */
    checkTimeClocks(buildingId: number): boolean {
        let alarm = false;

        // Get all time clocks in the building
        // TODO: Port hasClockAll() - gets objects with clock timers
        // For now, get all LSObjects and check if they have timers
        
        const objects = this.db.getRelatedObjects(buildingId, 'hasClock');
        
        for (const obj of objects) {
            // Get timer value for this object
            // TODO: Port ClockTimerGet() and ClockTimerSetP()
            // For now, stub it out
            
            const timerId = obj.id;
            const time = this.getClockTimer(timerId);
            
            if (time > 0) {
                // Decrement timer
                this.setClockTimer(timerId, time - 1);
            } else if (time === 0) {
                // Timer expired - trigger alarm
                alarm = true;
            }
        }

        return alarm;
    }

    /**
     * Get clock timer value
     * Port of ClockTimerGet() from dataappl.c
     */
    private getClockTimer(objectId: number): number {
        // TODO: Port full implementation
        // For now, return -1 (no timer)
        return -1;
    }

    /**
     * Set clock timer value
     * Port of ClockTimerSetP() from dataappl.c
     */
    private setClockTimer(objectId: number, value: number): void {
        // TODO: Port full implementation
    }

    /**
     * Calculate total loudness
     * Port of tcGetTotalLoudness() from dataappl.c
     * 
     * Calculates the total loudness from all team members.
     * Takes the maximum loudness and increases it by ~20%.
     */
    getTotalLoudness(loud0: number, loud1: number, loud2: number, loud3: number): number {
        // Get maximum loudness
        let total = Math.max(loud0, loud1);
        total = Math.max(total, loud2);
        total = Math.max(total, loud3);

        // Increase by ~20%
        total = this.calcValue(total, 0, 255, 255, 20);

        return total;
    }

    /**
     * Check alarm by loudness
     * Port of tcAlarmByLoudness() from dataappl.c
     * 
     * Checks if the loudness level triggers an alarm.
     * Should be called every second (every 3 ticks).
     * Returns true if alarm should be triggered.
     */
    alarmByLoudness(building: Building, totalLoudness: number): boolean {
        // Check if loudness exceeds building's maximum volume
        return totalLoudness > building.MaxVolume;
    }

    /**
     * Calculate value with percentage increase
     * Port of CalcValue() from dataappl.c
     */
    private calcValue(value: number, min: number, max: number, base: number, percent: number): number {
        // Increase value by percentage
        return Math.floor(value * (base + percent) / base);
    }

    /**
     * Check alarm by patrol
     * Port of tcAlarmByPatrol() from dataappl.c
     * 
     * Checks if patrol detection triggers an alarm.
     * Patrols detect changes faster now: 100 -> 125.
     * Returns true if alarm should be triggered.
     */
    alarmByPatrol(
        building: Building,
        changeCount: number,
        totalCount: number,
        patrolCount: number
    ): boolean {
        // Constant from C code
        const tcPATROL_ALARM = 100;

        // Calculate threshold
        // More changes = higher chance of detection
        // More patrols = higher chance of detection
        const threshold = (totalCount * tcPATROL_ALARM) / (125 * patrolCount);

        return changeCount > threshold;
    }

    /**
     * Check alarm by microphone
     * Port of tcAlarmByMicro() from gp.c
     * 
     * Checks if microphone detection triggers an alarm.
     * Returns true if alarm should be triggered.
     */
    alarmByMicro(xPos: number, yPos: number, loudness: number): boolean {
        // TODO: Port full implementation
        // - Get microphones in area
        // - Check distance to each microphone
        // - Compare loudness with sensitivity
        // - Return true if alarm triggered
        
        return false;
    }

    /**
     * Check alarm by radio
     * Port of tcAlarmByRadio() from dataappl.c
     * 
     * Checks if radio usage triggers an alarm.
     * Should be called after each radio transmission.
     * Returns true if alarm should be triggered.
     */
    alarmByRadio(building: Building): boolean {
        // Calculate random value (0-5000)
        // 10 radio calls at Guarding=250 should trigger alarm
        const random = this.randomNr(0, 2500) + this.randomNr(0, 2500);

        // Check against building's radio guarding level
        return random < building.RadioGuarding;
    }

    /**
     * Generate random number for game logic
     * Port of CalcRandomNrForGameLogic() from random.c
     */
    private randomNr(min: number, max: number): number {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    /**
     * Check alarm by touch
     * Port of tcAlarmByTouch() from gp.c
     * 
     * Checks if touching an object triggers an alarm.
     * Returns true if alarm should be triggered.
     */
    alarmByTouch(objectId: number): boolean {
        // TODO: Port full implementation
        // - Check if object has alarm
        // - Check if alarm is active
        // - Return true if alarm triggered
        
        return false;
    }

    /**
     * Check alarm by power loss
     * Port of tcAlarmByPowerLoss() from gp.c
     * 
     * Checks if power loss triggers an alarm.
     * Returns true if alarm should be triggered.
     */
    alarmByPowerLoss(objectId: number): boolean {
        // TODO: Port full implementation
        // - Check if object is connected to alarm system
        // - Check if power loss detection is active
        // - Return true if alarm triggered
        
        return false;
    }

    /**
     * Calculate team mood
     * Port of tcGetTeamMood() from dataappl.c
     * 
     * Calculates the team's current mood/morale.
     * Returns mood value (0-255).
     */
    getTeamMood(guyIds: number[], time: number): number {
        let team = 0;
        let count = 0;

        // Sum individual moods
        for (let i = 0; i < 4 && guyIds[i]; i++) {
            const person = this.db.getObject(guyIds[i]) as Person;
            if (person) {
                const mood = person.Mood || 127;  // Default mood
                team += mood;
                count++;
            }
        }

        // Average mood
        if (count > 0) {
            team = Math.floor(team / count);
        }

        // Adjust based on plan perfection
        const perfect = this.isPlanPerfect(time);
        team = this.calcValue(team, 0, 255, (perfect * 20) / 35, 100);

        return team;
    }

    /**
     * Check if plan is being executed perfectly
     * Port of tcIsPlanPerfect() from dataappl.c
     * 
     * Calculates how well the plan is being executed.
     * Returns perfection value (0-255).
     */
    private isPlanPerfect(timer: number): number {
        // TODO: Get actual deviation time, call value, and warning count
        // For now, use defaults
        const deriTime = 0;
        const callValue = 0;
        const warningCount = 0;

        // Calculate perfection based on deviation from plan
        let perfect = Math.floor((255 * (timer + 1 - deriTime)) / (timer + 1));
        perfect = Math.max(perfect, 0);

        // Adjust for radio calls
        perfect = this.changeAbs(perfect, callValue, 0, 255);

        // Adjust for warnings
        perfect = this.changeAbs(perfect, warningCount * (-35), 0, 255);

        return perfect;
    }

    /**
     * Change value with bounds checking
     * Port of ChangeAbs() from dataappl.c
     */
    private changeAbs(value: number, change: number, min: number, max: number): number {
        value += change;
        value = Math.max(min, Math.min(max, value));
        return value;
    }

    /**
     * Check watchdog warning
     * Port of tcWatchDogWarning() from gp.c
     * 
     * Checks if a person with watchdog ability detects danger.
     * Returns warning level (0 = no warning).
     */
    watchDogWarning(personId: number): number {
        // TODO: Port full implementation
        // - Check if person has watchdog ability
        // - Calculate detection probability
        // - Return warning level
        
        return 0;
    }

    /**
     * Check if guard detects burglar
     * Port of tcGuardDetectsGuy() from gp.c
     * 
     * Checks if a guard detects a burglar.
     * Returns true if detected.
     */
    guardDetectsGuy(
        guardRoomList: any,
        xPos: number,
        yPos: number,
        direction: number,
        guardName: string,
        burglarName: string
    ): boolean {
        // TODO: Port full implementation
        // - Check line of sight
        // - Check distance
        // - Factor in lighting
        // - Factor in guard abilities
        // - Return true if detected
        
        return false;
    }

    /**
     * Calculate tool usage time
     * Port of tcGuyUsesToolInPlayer() from gp.c
     * 
     * Calculates the actual time needed to use a tool.
     * Returns time in seconds.
     */
    guyUsesToolInPlayer(
        personId: number,
        building: Building,
        toolId: number,
        itemType: number,
        plannedTime: number
    ): number {
        // TODO: Port full implementation
        // - Get person abilities
        // - Get tool effectiveness
        // - Calculate actual time based on skill
        // - Return actual time
        
        // For now, return planned time
        return plannedTime;
    }

    /**
     * Calculate tool loudness
     * Port of tcGetToolLoudness() from gp.c
     * 
     * Calculates the loudness of using a tool.
     * Returns loudness value.
     */
    getToolLoudness(personId: number, toolId: number, itemType: number): number {
        // TODO: Port full implementation
        // - Get tool loudness rating
        // - Factor in person skill
        // - Factor in item type
        // - Return loudness value
        
        // Default loudness
        return 10;
    }

    /**
     * Calculate walk loudness
     * Port of tcGetWalkLoudness() from gp.c
     * 
     * Calculates the loudness of walking.
     * Returns loudness value.
     */
    getWalkLoudness(): number {
        // TODO: Port full implementation
        // - Factor in floor type
        // - Factor in person skill
        // - Return loudness value
        
        // Default walk loudness
        return 5;
    }

    /**
     * Calculate danger level
     * Port of tcGetDanger() from gp.c
     * 
     * Calculates the danger of using a tool on an object.
     * Returns true if dangerous (person gets hurt).
     */
    getDanger(personId: number, toolId: number, itemType: number): boolean {
        // TODO: Port full implementation
        // - Check tool danger rating
        // - Check person skill
        // - Calculate probability of injury
        // - Return true if injured
        
        return false;
    }

    /**
     * Kill the guard (combat)
     * Port of tcKillTheGuard() from gp.c
     * 
     * Handles combat with a guard.
     * Returns true if guard is knocked out.
     */
    killTheGuard(personId: number, buildingId: number): boolean {
        // TODO: Port full implementation
        // - Check person combat ability
        // - Check guard combat ability
        // - Calculate combat outcome
        // - Return true if guard knocked out
        
        return false;
    }

    /**
     * Calculate exhaustion when guy is in action
     * Port of tcGuyInAction() from dataappl.c
     * 
     * Calculates exhaustion increase during action.
     * Should be called every few action steps.
     * Returns new exhaustion value.
     */
    guyInAction(personId: number, currentExhaustion: number): number {
        const state = this.getGuyState(personId);

        let increase = 0;
        if (this.randomNr(0, 15) === 1) {
            // Exhaustion increase = inverse of state
            increase = Math.floor((255 - state) / 90);
        }

        return this.changeAbs(currentExhaustion, increase, 0, 255);
    }

    /**
     * Calculate exhaustion when guy is waiting
     * Port of tcGuyIsWaiting() from dataappl.c
     * 
     * Calculates exhaustion recovery during waiting.
     * Should be called every few wait steps.
     * Returns new exhaustion value.
     */
    guyIsWaiting(personId: number, currentExhaustion: number): number {
        const state = this.getGuyState(personId);

        let decrease = 0;
        if (this.randomNr(0, 4) === 1) {
            // Exhaustion decrease
            decrease = -Math.floor(state / 10);
        }

        return this.changeAbs(currentExhaustion, decrease, 0, 255);
    }

    /**
     * Get guy state (combination of abilities)
     * Port of tcGetGuyState() from dataappl.c
     */
    private getGuyState(personId: number): number {
        const person = this.db.getObject(personId) as Person;
        if (!person) return 127;

        // Calculate state from person attributes
        // TODO: Port full calculation
        // For now, use average of key attributes
        const skill = person.Skill || 127;
        const stamina = person.Stamina || 127;
        const health = person.Health || 127;

        return Math.floor((skill + stamina + health) / 3);
    }
}
