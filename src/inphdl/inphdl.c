/*  _________  _______
   / ___/ __ \/ __/ _ \      Der Clou!
  / /__/ /_/ /\ \/ ___/ Open Source Project
  \___/\____/___/_/ http://cosp.sourceforge.net
   Based on the original by neo Software GmbH
*/
#include "inphdl/inphdl.h"

#include <stdlib.h>

#include "SDL.h"
#include "inphdl/arrow1x_xpm.c"
#include "inphdl/arrow2x_xpm.c"
#include "random/random.h"
#include "replay/replay.h"
#include "sound/fx.h"
#include "sound/newsound.h"

static SDL_Cursor *cursor[2];

static ubyte cursorInit;
ubyte initMouseCursor(void);
void removeMouseCursor(void);

struct IHandler
{
    int32_t ul_XSensitivity;
    int32_t ul_YSensitivity;
    int32_t ul_WaitTicks;

    Uint16 us_MouseX;
    Uint16 us_MouseY;

    ubyte uch_EscStatus;
    ubyte uch_FunctionKeyStatus;
    ubyte uch_MouseStatus;
};

struct IHandler IHandler;

/* Fixed Time Step Loop State */
#define FIX_DT_FREQ 60
#define MAX_ACCUMULATOR_CLAMP_MS 250 /* Max catch-up time in ms */

typedef struct
{
    uint64_t currentTime;
    uint64_t accumulator;
    uint64_t performanceFrequency;
    uint64_t fixedStepTicks; /* Cycles per fixed step */
} GameLoopState;

static GameLoopState gameLoop = {0, 0, 0, 0};

/* Input Queue */
#define INPUT_QUEUE_SIZE 64
typedef struct
{
    int32_t events[INPUT_QUEUE_SIZE];
    int head;
    int tail;
    int count;
} InputQueue;

static InputQueue inputQueue = {{0}, 0, 0, 0};

void inpInitGameLoop(void)
{
    gameLoop.performanceFrequency = SDL_GetPerformanceFrequency();
    gameLoop.fixedStepTicks = gameLoop.performanceFrequency / FIX_DT_FREQ;
    gameLoop.currentTime = SDL_GetPerformanceCounter();
    gameLoop.accumulator = 0;

    /* Init Input Queue */
    inputQueue.head = 0;
    inputQueue.tail = 0;
    inputQueue.count = 0;
}

static void inpEnqueueEvent(int32_t action)
{
    if (inputQueue.count < INPUT_QUEUE_SIZE)
    {
        inputQueue.events[inputQueue.tail] = action;
        inputQueue.tail = (inputQueue.tail + 1) % INPUT_QUEUE_SIZE;
        inputQueue.count++;
    }
    /* Else: drop event (buffer full) - robust behavior */
}

static int32_t inpDequeueEvent(int32_t mask)
{
    /* Peek/Scan for matching event to preserve order */
    /* Note: Ideally we process FIFO. This simple scan finds the FIRST match?
       Actually, `inpWaitFor` asks for specific masks.
       If we have [KEY, MOUSE], and ask for MOUSE, should we skip KEY?
       Legacy behavior: `SDL_PollEvent` returns whatever is next.
       Wait, `inpWaitFor` loops calling PollEvent until `action` is found.
       So if Key is first, it sets action |= KEY. If mask has KEY, it returns.
       If mask doesn't have KEY, it keeps polling.
       So we should scan the queue. If we find a match, we remove it?
       Removing from middle of circular buffer is hard.

       Simplification: Just peek head. If head matches mask, dequeue and return.
       If head doesn't match mask, but IS an input event, what did legacy do?
       Legacy:
         while (!action) {
           while(SDL_Poll) { match -> action |= ... }
         }
       It effectively drained the entire SDL queue every frame and set bits.
       Events not in mask were implicitly DROPPED/IGNORED by `switch(event.type)`.

       Wait, look at legacy `inpWaitFor`:
       It loops `SDL_PollEvent`. Inside switch, it checks `if (l_Mask & INP_...)`.
       If the mask matches, it adds to `action`.
       If mask doesn't match, the event is consumed from SDL and DISCARDED.

       SO: We can just Dequeue everything, check if it matches mask.
       If it matches, return it. If not, discard it.
       Verify: did legacy buffer events? No. `inpWaitFor` is the only consumer.
       If you call `inpWaitFor(INP_A)` and press `INP_B`, `INP_B` is lost.
       Correct.

       So `inpDequeueEvent` just needs to return the next event, and `inpWaitFor` decides keep or drop.
    */

    if (inputQueue.count > 0)
    {
        int32_t evt = inputQueue.events[inputQueue.head];
        inputQueue.head = (inputQueue.head + 1) % INPUT_QUEUE_SIZE;
        inputQueue.count--;
        return evt;
    }
    return 0;
}

static SDL_Cursor *init_system_cursor(char *image[])
{
    int i = 0;
    int row = 0;
    int col = 0;
    Uint8 data[4 * 32];
    Uint8 mask[4 * 32];
    int hot_x = 0;
    int hot_y = 0;

    i = -1;
    for (row = 0; row < 32; ++row)
    {
        for (col = 0; col < 32; ++col)
        {
            if (col % 8)
            {
                data[i] <<= 1;
                mask[i] <<= 1;
            }
            else
            {
                ++i;
                data[i] = mask[i] = 0;
            }
            switch (image[4 + row][col])
            {
                case 'X':
                    data[i] |= 0x01;
                    mask[i] |= 0x01;
                    break;
                case '.':
                    mask[i] |= 0x01;
                    break;
                case ' ':
                    break;
            }
        }
    }
    sscanf(image[4 + row], "%d,%d", &hot_x, &hot_y);
    return SDL_CreateCursor(data, mask, 32, 32, hot_x, hot_y);
}

void setMouseCursor(ubyte fact)
{
    if (cursorInit)
    {
        switch (fact)
        {
            case 1:
            case 2:
                SDL_SetCursor(cursor[0]);
                break;

            case 3:
            case 4:
                SDL_SetCursor(cursor[1]);
                break;
        }
        SDL_ShowCursor(1);
    }
}

ubyte initMouseCursor(void)
{
    if (!cursorInit)
    {
        cursor[0] = init_system_cursor(arrow1x);

        if (!cursor[0])
        {
            Log("SDL_CreateCursor -> %s", SDL_GetError());
            return 0;
        }

        cursor[1] = init_system_cursor(arrow2x);

        if (!cursor[1])
        {
            Log("SDL_CreateCursor -> %s", SDL_GetError());
            return 0;
        }
    }
    return 1;
}

void removeMouseCursor(void)
{
    if (cursorInit)
    {
        SDL_ShowCursor(0);
        SDL_FreeCursor(cursor[0]);
        SDL_FreeCursor(cursor[1]);
    }
}

/* 2014-01-10 LucyG: Joystick */
static SDL_Joystick *inpJoystick = NULL;

static void inpInitJoystick(void)
{
    int numJoys = 0;
    int i = 0;

    inpJoystick = NULL;
    if (!Config.UseJoystick)
    {
        return;
    }

    if (SDL_InitSubSystem(SDL_INIT_JOYSTICK))
    {
        Log("Failed to init joystick subsystem.");
        Config.UseJoystick = 0;
        return;
    }

    numJoys = SDL_NumJoysticks();
    if (numJoys <= 0)
    {
        Log("No joystick detected.");
        Config.UseJoystick = 0;
        return;
    }

    if (Config.UseJoystick <= numJoys)
    {
        inpJoystick = SDL_JoystickOpen(Config.UseJoystick - 1);
        if (inpJoystick)
        {
            SDL_JoystickEventState(SDL_ENABLE);
            return;
        }
    }

    Log("Failed to open joystick #%d. Please try a different one.", Config.UseJoystick);
    for (i = 0; i < numJoys; i++)
    {
        Log("#%d = \"%s\"", i + 1, SDL_JoystickNameForIndex(i));
    }
    Config.UseJoystick = 0;
}

static void inpQuitJoystick(void)
{
    if (inpJoystick)
    {
        SDL_JoystickEventState(SDL_IGNORE);
        SDL_JoystickClose(inpJoystick);
        inpJoystick = NULL;
    }
}

void inpOpenAllInputDevs(void)
{
    IHandler.uch_EscStatus = 1;
    IHandler.uch_FunctionKeyStatus = 1;
    IHandler.uch_MouseStatus = 1;

    // 2014-07
    cursorInit = initMouseCursor();
    setMouseCursor(gfxScalingFactor);

    if (Config.UseJoystick)
    {
        inpInitJoystick();
    }
}

static void inpSimulateOneTick(void)
{
    Replay_IncrementTick();
    sndDoFading();
    animator();
}

static void inpPumpEvents(void)
{
    SDL_Event event;
    int32_t action = 0;
    SDL_Keycode sym = (SDL_Keycode)0;

    while (SDL_PollEvent(&event))
    {
        action = 0;
        switch (event.type)
        {
            case SDL_KEYDOWN:
                sym = event.key.keysym.sym;
                if (sym == SDLK_LEFT)
                    action |= INP_KEYBOARD | INP_LEFT;
                else if (sym == SDLK_RIGHT)
                    action |= INP_KEYBOARD | INP_RIGHT;
                else if (sym == SDLK_UP)
                    action |= INP_KEYBOARD | INP_UP;
                else if (sym == SDLK_DOWN)
                    action |= INP_KEYBOARD | INP_DOWN;
                break;
            case SDL_KEYUP:
                sym = event.key.keysym.sym;
                if ((sym == SDLK_SPACE) || (sym == SDLK_RETURN) || (sym == SDLK_KP_ENTER))
                    action |= INP_KEYBOARD | INP_LBUTTONP;
                if (sym == SDLK_ESCAPE)
                {
                    /* Check ESC status later or here?
                       Legacy checked `if (IHandler.uch_EscStatus && (l_Mask & INP_ESC)...)`
                       Here we assume raw input. Filter in WaitFor?
                       Let's map it to INP_ESC here. */
                    action |= INP_KEYBOARD | INP_ESC;
                }
                if ((sym >= SDLK_F1) && (sym <= SDLK_F11)) action |= INP_KEYBOARD | INP_FUNCTION_KEY;

                /* Handle global keys (F11, F12, Volume) immediately or queue?
                   Legacy handled them inside the loop. To maintain "pump works everywhere",
                   we should probably handle them here. */
                switch (sym)
                {
                    case SDLK_F11:
                        gfxScreenshotShadow();
                        break;
                    case SDLK_F12:
                        gfxScreenshot();
                        break;
                    case SDLK_INSERT:
                        Config.MusicVolume =
                            (Config.MusicVolume + 25 > SND_MAX_VOLUME) ? SND_MAX_VOLUME : Config.MusicVolume + 25;
                        break;
                    case SDLK_DELETE:
                        Config.MusicVolume = (Config.MusicVolume - 25 < 0) ? 0 : Config.MusicVolume - 25;
                        break;
                    case SDLK_HOME:
                        Config.SfxVolume =
                            (Config.SfxVolume + 25 > SND_MAX_VOLUME) ? SND_MAX_VOLUME : Config.SfxVolume + 25;
                        break;
                    case SDLK_END:
                        Config.SfxVolume = (Config.SfxVolume - 25 < 0) ? 0 : Config.SfxVolume - 25;
                        break;
                    case SDLK_PAGEUP:
                        Config.VoiceVolume =
                            (Config.VoiceVolume + 25 > SND_MAX_VOLUME) ? SND_MAX_VOLUME : Config.VoiceVolume + 25;
                        break;
                    case SDLK_PAGEDOWN:
                        Config.VoiceVolume = (Config.VoiceVolume - 25 < 0) ? 0 : Config.VoiceVolume - 25;
                        break;
                }
                break;
            case SDL_MOUSEMOTION:
                event.motion.x = (event.motion.x - gfxScalingOffsetX) / gfxScalingFactor;
                event.motion.y = (event.motion.y - gfxScalingOffsetY) / gfxScalingFactor;
                if (event.motion.x < IHandler.us_MouseX)
                    action |= INP_MOUSE | INP_LEFT;
                else if (event.motion.x > IHandler.us_MouseX)
                    action |= INP_MOUSE | INP_RIGHT;
                if (event.motion.y < IHandler.us_MouseY)
                    action |= INP_MOUSE | INP_UP;
                else if (event.motion.y > IHandler.us_MouseY)
                    action |= INP_MOUSE | INP_DOWN;
                IHandler.us_MouseX = event.motion.x;
                IHandler.us_MouseY = event.motion.y;
                break;
            case SDL_MOUSEBUTTONDOWN:
                if (event.button.button == SDL_BUTTON_LEFT) action |= INP_MOUSE | INP_LBUTTONP;
                if (event.button.button == SDL_BUTTON_RIGHT) action |= INP_MOUSE | INP_RBUTTONP;
                IHandler.us_MouseX = (event.button.x - gfxScalingOffsetX) / gfxScalingFactor;
                IHandler.us_MouseY = (event.button.y - gfxScalingOffsetY) / gfxScalingFactor;
                break;
            case SDL_MOUSEBUTTONUP:
                if (event.button.button == SDL_BUTTON_LEFT) action |= INP_MOUSE | INP_LBUTTONR;
                if (event.button.button == SDL_BUTTON_RIGHT) action |= INP_MOUSE | INP_RBUTTONR;
                IHandler.us_MouseX = (event.button.x - gfxScalingOffsetX) / gfxScalingFactor;
                IHandler.us_MouseY = (event.button.y - gfxScalingOffsetY) / gfxScalingFactor;
                break;
            case SDL_MOUSEWHEEL:
                if (event.wheel.y >= 0)
                    action |= INP_MOUSEWHEEL | INP_UP;
                else
                    action |= INP_MOUSEWHEEL | INP_DOWN;
                break;
            case SDL_JOYAXISMOTION:
                if (event.jaxis.axis == 0)
                {
                    if (event.jaxis.value < -10000)
                        action |= INP_KEYBOARD | INP_LEFT;
                    else if (event.jaxis.value > 10000)
                        action |= INP_KEYBOARD | INP_RIGHT;
                }
                else if (event.jaxis.axis == 1)
                {
                    if (event.jaxis.value < -10000)
                        action |= INP_KEYBOARD | INP_UP;
                    else if (event.jaxis.value > 10000)
                        action |= INP_KEYBOARD | INP_DOWN;
                }
                break;
            case SDL_JOYBUTTONUP:
                action |= INP_KEYBOARD | INP_LBUTTONP;
                break;
            case SDL_QUIT:
                Log("DEBUG: inpPumpEvents received SDL_QUIT");
                action |= INP_QUIT;
                break;
        }

        if (action)
        {
            inpEnqueueEvent(action);
        }
    }
}

static void inpDoPseudoMultiTasking(void)
{
    /* Use fixed loop logic implicitly?
       Legacy code called this to run anims/sound.
       Now we want `inpWaitFor` and `inpDelay` to run the loop.
       Existing calls to `inpDoPseudoMultiTasking` outside `inpWaitFor` (if any?)
       might be problematic. grep says it's only called in `inpWaitFor` and `inpDelay`?
       Let's check.
       Grep showed: inphdl.c:206 (def), inphdl.c:248 (in inpDelay), inphdl.c:495 (in inpWaitFor).
       So replacing its body is not sufficient, we need to replace the call sites.
       But for safety, let's make this function just perform *one* tick if called?
       No, `inpSimulateOneTick` does that.
       Legacy `inpDoPseudoMultiTasking` used `SDL_GetTicks` to throttle itself.
       If I keep it, it should use the new `GameLoopState` to ensure consistency.
       */
    uint64_t newTime = SDL_GetPerformanceCounter();
    uint64_t frameTime = newTime - gameLoop.currentTime;
    gameLoop.currentTime = newTime;

    if (g_ReplayState == REPLAY_PLAYING)
    {
        frameTime = (uint64_t)(frameTime * Replay_GetSpeed());
    }

    gameLoop.accumulator += frameTime;

    /* Clamp */
    uint64_t maxAccumulator = gameLoop.fixedStepTicks * 5;
    if (g_ReplayState == REPLAY_PLAYING)
    {
        maxAccumulator = (uint64_t)(maxAccumulator * Replay_GetSpeed());
    }

    if (gameLoop.accumulator > maxAccumulator) /* Clamp to ~5 frames */
        gameLoop.accumulator = maxAccumulator;

    while (gameLoop.accumulator >= gameLoop.fixedStepTicks)
    {
        inpSimulateOneTick();
        gameLoop.accumulator -= gameLoop.fixedStepTicks;
    }
}

void inpCloseAllInputDevs(void)
{
    // remove mouse cursor
    removeMouseCursor();

    if (Config.UseJoystick)
    {
        inpQuitJoystick();
    }
}

void inpDelay(int32_t l_Ticks)
{
    int32_t ticksWaited = 0;

    // Ensure loop is initialized
    if (gameLoop.performanceFrequency == 0) inpInitGameLoop();

    while (ticksWaited < l_Ticks)
    {
        uint64_t newTime = SDL_GetPerformanceCounter();
        uint64_t frameTime = newTime - gameLoop.currentTime;
        gameLoop.currentTime = newTime;

        if (g_ReplayState == REPLAY_PLAYING)
        {
            frameTime = (uint64_t)(frameTime * Replay_GetSpeed());
        }

        gameLoop.accumulator += frameTime;

        /* Clamp accumulator */
        uint64_t maxAccumulator = gameLoop.fixedStepTicks * 4;
        if (g_ReplayState == REPLAY_PLAYING)
        {
            maxAccumulator = (uint64_t)(maxAccumulator * Replay_GetSpeed());
        }

        if (gameLoop.accumulator > maxAccumulator) gameLoop.accumulator = maxAccumulator;

        while (gameLoop.accumulator >= gameLoop.fixedStepTicks)
        {
            inpSimulateOneTick();
            gameLoop.accumulator -= gameLoop.fixedStepTicks;
            ticksWaited++;
            if (ticksWaited >= l_Ticks) break;
        }

        inpPumpEvents();
        wfr();

        /* Yield if ahead */
        if (gameLoop.accumulator < gameLoop.fixedStepTicks)
        {
            /* Simple yield to avoid 100% CPU */
            SDL_Delay(1);
        }
    }
}

void inpGetMouseXY(struct RastPort *p_RP, uword *p_X, uword *p_Y)
{
    *p_X = IHandler.us_MouseX - p_RP->us_LeftEdge;
    *p_Y = IHandler.us_MouseY - p_RP->us_TopEdge;
}

uword inpGetMouseY(struct RastPort *p_RP) { return (IHandler.us_MouseY) - p_RP->us_TopEdge; }

void inpSetWaitTicks(int32_t l_Ticks)
{
    // 2018-09-26 : timing fixes
    if (l_Ticks < INP_AS_FAST_AS_POSSIBLE)
    {
        l_Ticks = INP_AS_FAST_AS_POSSIBLE;
    }
    IHandler.ul_WaitTicks = l_Ticks;
}

void inpTurnESC(uword us_NewStatus) { IHandler.uch_EscStatus = (ubyte)us_NewStatus; }

void inpTurnFunctionKey(uword us_NewStatus) { IHandler.uch_FunctionKeyStatus = (ubyte)us_NewStatus; }

void inpTurnMouse(uword us_NewStatus) { IHandler.uch_MouseStatus = (ubyte)us_NewStatus; }

int32_t inpWaitFor(int32_t l_Mask)
{
    int32_t action = 0;
    int32_t ticksForTimeout = 0;
    int32_t ticksElapsed = 0;

    // Ensure loop is initialized
    if (gameLoop.performanceFrequency == 0) inpInitGameLoop();

    /* Prepare Mask */
    if (IHandler.uch_EscStatus && !(l_Mask & INP_NO_ESC)) l_Mask |= INP_ESC;
    if (IHandler.uch_FunctionKeyStatus) l_Mask |= INP_FUNCTION_KEY;

    if (l_Mask & INP_TIME)
    {
        ticksForTimeout = IHandler.ul_WaitTicks;
    }

    while (!action)
    {
        /* 1. Time Update */
        uint64_t newTime = SDL_GetPerformanceCounter();
        uint64_t frameTime = newTime - gameLoop.currentTime;
        gameLoop.currentTime = newTime;

        if (g_ReplayState == REPLAY_PLAYING)
        {
            frameTime = (uint64_t)(frameTime * Replay_GetSpeed());
        }

        gameLoop.accumulator += frameTime;

        /* Clamp accumulator to prevent spiral of death */
        uint64_t maxAccumulator = gameLoop.fixedStepTicks * 8;
        if (g_ReplayState == REPLAY_PLAYING)
        {
            maxAccumulator = (uint64_t)(maxAccumulator * Replay_GetSpeed());
        }

        if (gameLoop.accumulator > maxAccumulator) gameLoop.accumulator = maxAccumulator;

        /* REPLAY: Check Input Pre-Simulation (Current Tick) */
        if (g_ReplayState == REPLAY_PLAYING)
        {
            int32_t replayAction = 0;
            if (Replay_GetInput(g_SimulationTick, &replayAction, rndGetChecksum()))
            {
                if (replayAction & l_Mask)
                {
                    action = replayAction & l_Mask;
                    /* Schedule screenshot if this was a user action (not just time out) */
                    if (action & ~INP_TIME)
                    {
                        Replay_CaptureScreenshot();
                    }
                }
                else
                {
                    Log("REPLAY WARNING: Mask mismatch at tick %llu! Recorded=0x%X, Expected mask=0x%X",
                        (unsigned long long)g_SimulationTick, replayAction, l_Mask);
                    action = replayAction;
                }
            }
            if (action) break;
        }

        /* 2. Simulation Step(s) */
        while (gameLoop.accumulator >= gameLoop.fixedStepTicks)
        {
            inpSimulateOneTick();
            gameLoop.accumulator -= gameLoop.fixedStepTicks;

            /* Virtual Timeout Check */
            if (l_Mask & INP_TIME)
            {
                ticksElapsed++;
                if (ticksElapsed >= ticksForTimeout)
                {
                    action |= INP_TIME;
                }
            }

            /* REPLAY: Check Input Post-Simulation (Next Tick) */
            /* This catches inputs that happen exactly on the tick we just advanced to */
            if (g_ReplayState == REPLAY_PLAYING)
            {
                int32_t replayAction = 0;
                if (Replay_GetInput(g_SimulationTick, &replayAction, rndGetChecksum()))
                {
                    if (replayAction & l_Mask)
                    {
                        action = replayAction & l_Mask;
                        /* Schedule screenshot if this was a user action (not just time out) */
                        if (action & ~INP_TIME)
                        {
                            Replay_CaptureScreenshot();
                        }
                    }
                    else
                    {
                        Log("REPLAY WARNING: Mask mismatch at tick %llu! Recorded=0x%X, Expected mask=0x%X",
                            (unsigned long long)g_SimulationTick, replayAction, l_Mask);
                        action = replayAction;
                    }
                }
                if (action) break;
            }
        }

        if (action) break;

        /* 3. Input Pump & Check (Normal / Recording) */
        if (g_ReplayState != REPLAY_PLAYING)
        {
            inpPumpEvents();
            while (inputQueue.count > 0 && !action)
            {
                int32_t evt = inpDequeueEvent(0);
                if (evt & INP_QUIT)
                {
                    Log("DEBUG: Non-Replay Dequeued INP_QUIT");
                    if (Config.HeadlessMode || g_ReplayState != REPLAY_IDLE)
                    {
                        Log("Forced Quit (Headless/Replay)");
                        Replay_Close();
                        exit(0);
                    }
                }
                if (evt & l_Mask)
                {
                    action |= (evt & l_Mask);
                }
            }
        }
        else
        {
            /* Replay Playing: Just pump OS events, ignore queue */
            inpPumpEvents();

            /* Check for QUIT (e.g. from Signal) */
            while (inputQueue.count > 0)
            {
                int32_t evt = inpDequeueEvent(0);
                if (evt & INP_QUIT)
                {
                    Log("DEBUG: inpWaitFor dequeued INP_QUIT");
                    if (Config.HeadlessMode || g_ReplayState != REPLAY_IDLE)
                    {
                        Log("Forced Quit (Headless/Replay)");
                        Replay_Close();
                        exit(0);
                    }
                    action |= INP_QUIT;
                    break;
                }
            }
        }

        /* 4. Render */
        wfr();

        /* 5. Yield/Sleep */
        if (!action && gameLoop.accumulator < gameLoop.fixedStepTicks)
        {
            SDL_Delay(1);
        }
    }

    /* RECORDING HOOK */
    if (g_ReplayState == REPLAY_RECORDING)
    {
        /* We record the FINAL action that satisfied the wait */
        Replay_RecordInput(action, rndGetChecksum());
    }

    return action;
}

/*
 * rate = (x << 5) | y
 * x : Delay (0-3)
 * y : Repeat (0-31)
 */
void inpSetKeyRepeat(unsigned char rate)
{
    /* needs some experimenting... */
    // int x = (((rate & 0xe0) >> 5) + 1) << 7;
    // int y = ((rate & 0x1f) + 1) << 1;
    // TODO SDL2 int x = (((rate & 0xe0) >> 5) + 1) << 8;
    // TODO SDL2 int y = ((rate & 0x1f) + 1) << 4;
    // TODO SDL2 SDL_EnableKeyRepeat(x, y);
}
