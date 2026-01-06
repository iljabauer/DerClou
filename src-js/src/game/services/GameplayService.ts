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
     * Check alarm by microphone
     * Port of tcAlarmByMicro() from dataappl.c
     * 
     * Checks if loudness at position triggers microphone alarm.
     * Returns true if alarm should be triggered.
     */
    alarmByMicro(xPos: number, yPos: number, loudness: number): boolean {
        // Get microphone sensitivity at this position
        const micSensitivity = this.getLoudness(xPos, yPos);
        
        // Alarm if loudness exceeds microphone sensitivity
        return loudness > micSensitivity;
    }

    /**
     * Get loudness threshold at position (microphone sensitivity)
     * Port of lsGetLoudness() from landscap.c
     * 
     * Returns the microphone sensitivity at the given position.
     * Higher values mean less sensitive (more loudness allowed).
     */
    private getLoudness(xPos: number, yPos: number): number {
        // TODO: Port full implementation from LandscapeService
        // For now, return default value (no microphone = max loudness allowed)
        return 255;
    }

    /**
     * Check alarm by touch
     * Port of tcAlarmByTouch() from dataappl.c
     * 
     * Checks if touching an object triggers an alarm.
     * Returns true if alarm should be triggered.
     */
    alarmByTouch(lsoId: number): boolean {
        const lso = this.db.getObject(lsoId) as LSObject;
        if (!lso) return false;

        // Check if object is chained to alarm
        const CHAINED_TO_ALARM = 0x01;  // Const_tcCHAINED_TO_ALARM
        if (lso.Chained & CHAINED_TO_ALARM) {
            // Check if connected to enabled alarm
            return this.isConnectedWithEnabledAlarm(lsoId);
        }

        return false;
    }

    /**
     * Check if object is connected to an enabled alarm
     * Port of tcIsConnectedWithEnabledAlarm() from dataappl.c
     */
    private isConnectedWithEnabledAlarm(lsoId: number): boolean {
        // TODO: Port full implementation
        // - Check alarm relations
        // - Check if alarm is enabled
        // For now, assume alarms are enabled
        return true;
    }

    /**
     * Check alarm by power loss
     * Port of tcAlarmByPowerLoss() from dataappl.c
     * 
     * Checks if power loss triggers an alarm.
     * Returns true if alarm should be triggered.
     */
    alarmByPowerLoss(powerId: number): boolean {
        // Get all objects connected to this power source
        const connectedObjects = this.db.getRelatedObjects(powerId, 'hasPower');
        
        // Check if any connected object has alarm
        for (const obj of connectedObjects) {
            const lso = obj as LSObject;
            if (!lso) continue;

            const CHAINED_TO_ALARM = 0x01;  // Const_tcCHAINED_TO_ALARM
            if (lso.Status & CHAINED_TO_ALARM) {
                if (this.isConnectedWithEnabledAlarm(obj.id!)) {
                    return true;
                }
            }
        }

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
     * Port of tcWatchDogWarning() from dataappl.c
     * 
     * Checks if a person with watchdog ability detects danger.
     * Called when there IS a neighbor alarm.
     * Returns true if person detects something.
     */
    watchDogWarning(personId: number): boolean {
        // Get watchdog ability (Aufpassen)
        const watch = this.getAbilityValue(personId, 'Aufpassen');
        
        // Calculate random value (sum of 3 rolls for larger risk)
        const random = this.randomNr(0, 200) + 
                      this.randomNr(0, 200) + 
                      this.randomNr(0, 200);
        
        // Check if watchdog detects (with additional random check)
        if (watch > random && this.randomNr(0, 40) === 1) {
            return true;
        }
        
        return false;
    }

    /**
     * Check wrong watchdog warning (false alarm)
     * Port of tcWrongWatchDogWarning() from dataappl.c
     * 
     * Checks if a person with watchdog ability gives false alarm.
     * Called when there is NO neighbor alarm.
     * Returns true if person gives false alarm.
     */
    wrongWatchDogWarning(personId: number): boolean {
        // Get watchdog ability
        const watch = this.getAbilityValue(personId, 'Aufpassen');
        
        // Check if person makes a mistake
        if (this.randomNr(0, 255) > watch) {
            // Better ability = lower chance of false alarm
            if (this.randomNr(0, watch * 50) === 1) {
                return true;
            }
        }
        
        return false;
    }

    /**
     * Get ability value for person
     * Helper to get ability value from database
     */
    private getAbilityValue(personId: number, abilityName: string): number {
        // TODO: Port full implementation
        // For now, return default value
        return 127;
    }

    /**
     * Check if guard detects burglar
     * Port of tcGuardDetectsGuy() from dataappl.c
     * 
     * Checks if a guard detects a burglar.
     * xPos, yPos = guard position
     * direction = guard view direction
     * Returns true if detected.
     */
    guardDetectsGuy(
        guardRoomList: any,  // LIST of rooms
        xPos: number,
        yPos: number,
        direction: number,
        guardName: string,
        burglarName: string
    ): boolean {
        let detected = false;

        // Get burglar position
        const burglarXPos = this.getLivingXPos(burglarName);
        const burglarYPos = this.getLivingYPos(burglarName);

        // Check if in same area
        if (this.getLivingArea(guardName) === this.getLivingArea(burglarName)) {
            // Check if burglar is in guard's view direction
            if (this.isPositionInViewDirection(xPos, yPos, burglarXPos, burglarYPos, direction)) {
                // Check if in same room
                const X_HOTSPOT = 8;  // tcX_HOTSPOT
                if (this.insideSameRoom(guardRoomList, 
                                       xPos + X_HOTSPOT, yPos,
                                       burglarXPos + X_HOTSPOT, burglarYPos)) {
                    detected = true;
                }
            }
        }

        return detected;
    }

    /**
     * Get living X position
     * Port of livGetXPos() from living.c
     */
    private getLivingXPos(name: string): number {
        // TODO: Port from LivingService
        return 0;
    }

    /**
     * Get living Y position
     * Port of livGetYPos() from living.c
     */
    private getLivingYPos(name: string): number {
        // TODO: Port from LivingService
        return 0;
    }

    /**
     * Get living area
     * Port of livWhereIs() from living.c
     */
    private getLivingArea(name: string): number {
        // TODO: Port from LivingService
        return 0;
    }

    /**
     * Check if position is in view direction
     * Port of livIsPositionInViewDirection() from living.c
     */
    private isPositionInViewDirection(
        guardX: number, guardY: number,
        targetX: number, targetY: number,
        direction: number
    ): boolean {
        // TODO: Port full implementation
        // For now, simple distance check
        const dx = Math.abs(targetX - guardX);
        const dy = Math.abs(targetY - guardY);
        return (dx < 100 && dy < 100);
    }

    /**
     * Check if two positions are in same room
     * Port of tcInsideSameRoom() from dataappl.c
     */
    private insideSameRoom(
        roomsList: any,
        x1: number, y1: number,
        x2: number, y2: number
    ): boolean {
        // TODO: Port full implementation
        // For now, assume same room if close
        const dx = Math.abs(x2 - x1);
        const dy = Math.abs(y2 - y1);
        return (dx < 50 && dy < 50);
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
