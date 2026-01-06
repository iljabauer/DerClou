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
     * Port of tcGuyUsesToolInPlayer() from dataappl.c
     * 
     * Calculates the actual time needed to use a tool.
     * Returns time in seconds.
     */
    guyUsesToolInPlayer(
        personId: number,
        building: Building,
        toolId: number,
        itemId: number,
        needTime: number
    ): number {
        // Get base time from tool/item combination
        let time = this.guyUsesTool(personId, building, toolId, itemId);
        
        // Get necessary ability for this tool
        const ability = this.getNecessaryAbility(personId, toolId);
        
        // Random variation based on ability
        if (ability < this.randomNr(0, 230)) {
            if (this.randomNr(0, Math.floor(ability / 20)) === 1) {
                time = this.calcValue(time, 0, time * 4, Math.floor(ability / 2), 10);
            }
        }
        
        // Ensure time is at least the planned time
        if (time < needTime) {
            time = needTime;
        }
        
        return time;
    }

    /**
     * Calculate base tool usage time
     * Port of tcGuyUsesTool() from dataappl.c
     * 
     * This function must be deterministic (no randomness) for sync!
     */
    private guyUsesTool(
        personId: number,
        building: Building,
        toolId: number,
        itemId: number
    ): number {
        const person = this.db.getObject(personId) as Person;
        if (!person) return 0;

        // Get base time from break table
        const origin = this.breakGet(itemId, toolId);
        if (origin === -1) return 0;

        let time = origin;

        // Adjust time based on tool type and person attributes
        // Tool IDs from GameConstants
        const Tool_Elektrohammer = 1;
        const Tool_Hammer = 2;
        const Tool_Axt = 3;
        const Tool_Hand = 4;
        const Tool_Fusz = 5;
        const Tool_Chloroform = 6;
        const Tool_Bohrwinde = 7;
        const Tool_Schloszstecher = 8;
        const Tool_Glasschneider = 9;
        const Tool_Bohrmaschine = 10;
        const Tool_Brecheisen = 11;
        const Tool_Winkelschleifer = 12;
        const Tool_Schneidbrenner = 13;
        const Tool_Sauerstofflanze = 14;
        const Tool_Kernbohrer = 15;
        const Tool_Dietrich = 16;
        const Tool_Strickleiter = 17;
        const Tool_Stethoskop = 18;
        const Tool_Elektroset = 19;
        const Tool_Dynamit = 20;

        switch (toolId) {
            case Tool_Elektrohammer:
            case Tool_Hammer:
            case Tool_Axt:
                time = this.calcValue(time, 0, origin * 4, 127 + Math.floor((255 - person.Strength) / 2), 5);
                time = this.calcValue(time, 0, origin * 4, 127 + Math.floor((255 - person.Stamina) / 2), 10);
                break;
            case Tool_Hand:
            case Tool_Fusz:
            case Tool_Chloroform:
                time = this.calcValue(time, 0, origin * 4, 127 + Math.floor((255 - person.Skill) / 2), 5);
                time = this.calcValue(time, 0, origin * 4, 127 + Math.floor((255 - person.Strength) / 2), 10);
                break;
            case Tool_Bohrwinde:
                time = this.calcValue(time, 0, origin * 4, 127 + Math.floor((255 - person.Stamina) / 2), 5);
                time = this.calcValue(time, 0, origin * 4, 127 + Math.floor((255 - person.Skill) / 2), 10);
                break;
            case Tool_Schloszstecher:
            case Tool_Glasschneider:
            case Tool_Bohrmaschine:
            case Tool_Brecheisen:
                time = this.calcValue(time, 0, origin * 4, 127 + Math.floor((255 - person.Strength) / 2), 10);
                time = this.calcValue(time, 0, origin * 4, 127 + Math.floor((255 - person.Skill) / 2), 10);
                break;
            case Tool_Winkelschleifer:
            case Tool_Schneidbrenner:
            case Tool_Sauerstofflanze:
            case Tool_Kernbohrer:
                time = this.calcValue(time, 0, origin * 4, 127 + Math.floor((255 - person.Strength) / 2), 0);
                time = this.calcValue(time, 0, origin * 4, 127 + Math.floor((255 - person.Skill) / 2), 10);
                break;
            case Tool_Dietrich:
            case Tool_Strickleiter:
                time = this.calcValue(time, 0, origin * 4, 127 + Math.floor((255 - person.Skill) / 2), 10);
                break;
            case Tool_Stethoskop:
            case Tool_Elektroset:
            case Tool_Dynamit:
                time = this.calcValue(time, 0, origin * 4, 127 + Math.floor((255 - person.Intelligence) / 2), 10);
                time = this.calcValue(time, 0, origin * 4, 127 + Math.floor((255 - person.Skill) / 2), 10);
                break;
        }

        // Adjust for necessary ability
        const ability = this.getNecessaryAbility(personId, toolId);
        time = this.calcValue(time, 0, origin * 4, 127 + Math.floor((255 - ability) / 2), 50);

        // Adjust for alarm system quality
        const Item_Alarmanlage_X3 = 2;
        const Item_Alarmanlage_Top = 3;
        switch (itemId) {
            case Item_Alarmanlage_X3:
                time = this.calcValue(time, 0, origin * 4, 255, 30);
                break;
            case Item_Alarmanlage_Top:
                time = this.calcValue(time, 0, origin * 4, 255, 50);
                break;
        }

        // Adjust for building exactness and person panic
        time = this.calcValue(time, 0, origin * 4, 120 + Math.floor((255 - building.Exactlyness) / 2), 20);
        time = this.calcValue(time, 0, origin * 4, 127 + Math.floor(person.Panic / 2), 10);

        // Can't be faster than base time
        time = Math.max(origin, time);

        return time;
    }

    /**
     * Get break time for tool/item combination
     * Port of breakGet() from dataappl.c
     */
    private breakGet(itemId: number, toolId: number): number {
        // TODO: Port full break table
        // For now, return default time
        return 60;  // 60 seconds default
    }

    /**
     * Get necessary ability for tool
     * Port of tcGetNecessaryAbility() from dataappl.c
     */
    private getNecessaryAbility(personId: number, toolId: number): number {
        // TODO: Port full implementation
        // For now, return default ability
        return 127;
    }

    /**
     * Calculate tool loudness
     * Port of tcGetToolLoudness() from dataappl.c
     * 
     * Calculates the loudness of using a tool.
     * Returns loudness value.
     */
    getToolLoudness(personId: number, toolId: number, itemId: number): number {
        const person = this.db.getObject(personId) as Person;
        if (!person) return 10;

        // Get base loudness from sound table
        let loudness = this.soundGet(itemId, toolId);

        // Adjust for person skill and panic
        loudness = this.calcValue(loudness, 0, 255, 255 - person.Skill, 10);
        loudness = this.calcValue(loudness, 0, 255, person.Panic, 5);

        return loudness;
    }

    /**
     * Get sound level for tool/item combination
     * Port of soundGet() from dataappl.c
     */
    private soundGet(itemId: number, toolId: number): number {
        // TODO: Port full sound table
        // For now, return default loudness
        return 20;  // Default loudness
    }

    /**
     * Calculate walk loudness
     * Port of tcGetWalkLoudness() from dataappl.c
     * 
     * Calculates the loudness of walking.
     * Returns loudness value.
     */
    getWalkLoudness(personId: number): number {
        const WALK_LOUDNESS = 5;  // tcWALK_LOUDNESS
        let loudness = WALK_LOUDNESS;

        // Check if person has special shoes (reduces loudness)
        const Tool_Schuhe = 21;  // Special shoes
        const Person_Matt_Stuvysunt = 1;
        if (this.db.hasRelation(Person_Matt_Stuvysunt, Tool_Schuhe, 'has')) {
            loudness = Math.floor(loudness / 2);
        }

        return loudness;
    }

    /**
     * Calculate danger level
     * Port of tcGetDanger() from dataappl.c
     * 
     * Calculates the danger of using a tool on an object.
     * Returns danger level (0 = no danger, >0 = injured).
     */
    getDanger(personId: number, toolId: number, itemId: number): number {
        const person = this.db.getObject(personId) as Person;
        if (!person) return 0;

        // Get base danger from hurt table
        let danger = this.hurtGet(itemId, toolId);

        // Adjust for person attributes
        danger = this.calcValue(danger, 0, 255, 255 - person.Skill, 30);
        danger = this.calcValue(danger, 0, 255, 255 - person.Stamina, 10);
        danger = this.calcValue(danger, 0, 255, person.Panic, 5);

        // Check if person gets injured
        if (danger > this.randomNr(40, 255)) {
            // Maybe injured
            if (this.randomNr(0, 10) === 1) {
                // Actually injured - reduce health
                person.OldHealth = person.Health;
                person.Health = this.calcValue(person.Health, 0, 255, 127 - danger, 90);
                return danger;
            }
        }

        return 0;
    }

    /**
     * Get hurt level for tool/item combination
     * Port of hurtGet() from dataappl.c
     */
    private hurtGet(itemId: number, toolId: number): number {
        // TODO: Port full hurt table
        // For now, return default danger
        return 10;  // Default danger
    }

    /**
     * Kill the guard (combat)
     * Port of tcKillTheGuard() from dataappl.c
     * 
     * Handles combat with a guard.
     * Returns true if guard is knocked out.
     */
    killTheGuard(personId: number, buildingId: number): boolean {
        const person = this.db.getObject(personId) as Person;
        const building = this.db.getObject(buildingId) as Building;
        if (!person || !building) return false;

        // Get combat ability (Kampf)
        const power = this.getAbilityValue(personId, 'Kampf');

        // Check if person can defeat guard
        if (power >= building.GuardStrength) {
            return true;
        } else {
            // Person loses - reduce health
            person.OldHealth = person.Health;
            person.Health = this.calcValue(person.Health, 0, 255, 0, 90);
            return false;
        }
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
