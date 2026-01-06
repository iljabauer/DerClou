# Session 9 Analysis - Test Results

## Screenshot Comparison

### Screenshot 1 - Main Menu (8% diff)
**Status**: ✅ Mostly correct
- Background image loads correctly
- Menu items display correctly
- Differences: Font rendering (bitmap vs web font), slight positioning

### Screenshot 2 - Story Scene (61% diff)
**Status**: ⚠️ Rendering but layout wrong
- Background (Victoria Station) loads ✅
- Portrait (Old Matt) loads ✅
- Speech bubble renders ✅
- Text displays ✅
- Issues:
  - Portrait position wrong (middle-left vs top-left)
  - Speech bubble style different (simple rect vs proper bubble)
  - Missing London buildings at bottom
  - Font differences (bitmap vs web)

### Screenshot 3 - Wrong Scene! (93% diff)
**Status**: ❌ Scene transition too early
- **Expected**: Still in Story Scene (Victoria Station with action menu)
- **Actual**: Location Scene (Holland Street)
- The story scene is transitioning to location scene after first click
- Should show multiple story dialogs before transitioning

## Root Cause

The StoryScene has only ONE dialog in `dialogSequence`:
```typescript
this.dialogSequence = [
    {
        scene: 'Victoria Station',
        date: '03.02.1953',
        character: 'Matt',
        portrait: 125,
        background: 131,
        text: storyText
    }
];
```

When the first LBTN_P or RIGHT action happens, it calls `advanceDialog()`, which increments the index to 1, finds no more dialogs, and immediately transitions to LocationScene.

## Solution

Need to add more story dialogs to match the C code sequence. The C code has multiple story segments:
- ST_30_OLD (opening monologue)
- ST_31_OLD_0 (continuation)
- ST_31_OLD_1 (continuation)
- etc.

## Action Plan

1. Load all story text segments from STORY_0D.TXT
2. Create multiple dialog entries in dialogSequence
3. Ensure proper progression through all dialogs before transitioning
4. Fix portrait and bubble positioning to match expected layout
5. Add time clock display
6. Add London buildings background overlay

## Test Replay Actions

From test output:
- Tick 83: LBTN_P (click to advance story)
- Tick 139: LBTN_P (click to advance story)
- Tick 188: LBTN_P (click to advance story)
- Tick 255: LBTN_P (click to advance story)
- Tick 381: LBTN_P (click to advance story)
- Tick 625: RIGHT (navigate menu)
- Tick 678: RIGHT (navigate menu)
- Tick 714: DOWN (navigate menu)
- Tick 756: LBTN_P (select menu item)

This shows 5 clicks in the story scene before menu navigation starts. So we need at least 5 story dialog segments.
