# Scene System Analysis

## Overview

The scene system (src/scenes/scenes.c) provides the main gameplay interactions:
- Go() - Navigate between locations
- Information() - View player/car/person/tool/building info
- Look() - Examine current location and people
- tcTelefon() - Make phone calls
- tcWait() - Wait and advance time

## Dependencies

### Critical Dependencies (Must Port First)
1. **Film System** (src/story/)
   - `film->akt_Ort` - Current location
   - `film->loc_names` - Location name list
   - Story/scene management

2. **Location System** (src/data/dataappl.c)
   - `GetLocation` - Get current location number
   - `GetObjNrOfLocation(locNr)` - Get object ID for location
   - Location-object mapping

3. **Present System** (src/present/present.c)
   - `Present(objID, type, initFunc)` - Display object information
   - `InitPersonPresent`, `InitCarPresent`, etc.
   - Object property display

4. **Relation Queries**
   - `hasAll(owner, flags, type)` - Get all objects of type owned by owner
   - `knowsAll(person, flags, type)` - Get all known objects
   - `livesIn(location, person)` - Check if person lives at location
   - Already have basic relation support in Database

### Existing Systems (Ready to Use)
- ✅ DialogService - DynamicTalk() for conversations
- ✅ TextService - Text lookup and display
- ✅ UIService - Menus and bubbles
- ✅ Database - Object storage and relations

## Function Analysis

### Go() - Location Navigation
```c
uint32_t Go(LIST *succ)
```
- Takes list of successor events/locations
- Shows menu if multiple choices
- Returns selected event number
- **Requires:** Film system, Menu system

### Information() - Info Menu
```c
void Information(void)
```
- Shows menu with 7 options:
  0. Player info (Player + Matt)
  1. Cars (list and display)
  2. Persons (list and display)
  3. Tools (list and display)
  4. Buildings (list and display)
  5. Loot info
  6. Exit
- **Requires:** Present system, hasAll/knowsAll queries

### Look() - Examine Location
```c
void Look(uint32_t locNr)
```
- Shows menu with 3 options:
  0. Location description
  1. People at location
  2. Exit
- **Requires:** Location system, hasAll queries, Present system

### tcTelefon() - Phone Calls
```c
uint32_t tcTelefon(void)
```
- Show phone graphic
- List known persons
- Check if person is home (livesIn)
- Call DynamicTalk() if available
- **Requires:** knowsAll, livesIn, DynamicTalk (✅)

### tcWait() - Time Progression
```c
void tcWait(void)
```
- Show time menu
- Allow waiting in increments
- Update game time
- **Requires:** Time system, ShowTime()

## Porting Strategy

### Phase 3A: Foundation Systems (Priority 1)
1. **Film/Story System**
   - Port basic story structure
   - Scene management
   - Location tracking
   - Event system

2. **Location System**
   - GetLocation implementation
   - GetObjNrOfLocation implementation
   - Location-object mapping

3. **Relation Query System**
   - hasAll() - Get owned objects
   - knowsAll() - Get known objects
   - livesIn() - Location check
   - Extend Database with query methods

### Phase 3B: Present System (Priority 2)
1. **Present Framework**
   - Present() function
   - Object property display
   - Init functions for each type

2. **Type-Specific Presenters**
   - InitPersonPresent
   - InitCarPresent
   - InitToolPresent
   - InitBuildingPresent
   - InitLootPresent

### Phase 3C: Scene Functions (Priority 3)
1. **Simple Functions First**
   - tcTelefon() - Uses existing DynamicTalk
   - Look() - Simpler than Information

2. **Complex Functions**
   - Information() - Many object types
   - Go() - Requires full film system
   - tcWait() - Requires time system

## Recommended Approach

Given the complexity and interdependencies, recommend:

1. **Skip to simpler systems first**
   - Port interaction system (src/present/interac.c)
   - Port landscape system (src/landscap/)
   - These have fewer dependencies

2. **Build foundation incrementally**
   - Add relation query methods to Database
   - Create stub Film/Story system
   - Implement location tracking

3. **Port scene functions last**
   - Once all dependencies are ready
   - Test each function independently
   - Integrate with game flow

## Alternative: Interaction System First

The interaction system (src/present/interac.c) might be simpler:
- Action menu (Go, Talk, Look, Wait, Think)
- Calls scene functions
- Less complex than scene functions themselves
- Good entry point for understanding game flow

## Notes

- Scene system is central to gameplay
- Many interdependencies make it complex
- Better to port dependencies first
- Consider interaction system as entry point
- Present system is large but self-contained
- Film/story system is critical foundation
