/*  _________  _______
   / ___/ __ \/ __/ _ \      Der Clou!
  / /__/ /_/ /\ \/ ___/ Open Source Project
  \___/\____/___/_/ http://cosp.sourceforge.net
   Based on the original by neo Software GmbH
*/
#include "random/random.h"

#include <stdio.h>

static int rndFixedSeedActive = 0;
static uint32_t g_RngChecksum = 0;

// Custom RNG State
// Using uint32_t as requested for well-defined overflow behavior
static uint32_t g_my_seed = 0;

void rndInit(void)
{
    // printf("DEBUG: rndInit() called (time-based seed)\n");
#ifndef __COSP__
    randomize(); /* Zufallszahl über Timer initialisieren */
#else
    srand((unsigned int)time(NULL));
#endif
    // Also init our custom seed with time, just in case specific init isn't called
    g_my_seed = (uint32_t)time(NULL);
    rndFixedSeedActive = 0;
}

void rndInitWithSeed(unsigned int seed)
{
    // printf("DEBUG: rndInitWithSeed(%u) - Setting custom RNG state\n", seed);
    g_my_seed = (uint32_t)seed;
    g_RngChecksum = 0;
    rndFixedSeedActive = 1;

    // We also seed the system rand for cosmetics (if they run)
    srand(seed);
}

// Internal LCG implementation
// Formula: MSVC equivalent (seed = seed * 214013 + 2531011)
// Returns 15-bit value (0-32767) to mimic standard rand() behavior
static uint32_t my_rand(void)
{
    g_my_seed = g_my_seed * 214013 + 2531011;
    return (g_my_seed >> 16) & 0x7FFF;
}

uint32_t CalcRandomNr(uint32_t l_limit, uint32_t u_limit)
{
    // Use our custom, isolated RNG
    int r = (int)my_rand();

    uint32_t x = l_limit + (r % (u_limit - l_limit));

    g_RngChecksum ^= x;

    // printf("RNG: %d [%d-%d] RAW: %d Checksum: %x (FixedSeed: %d)\n", x, l_limit, u_limit, r, g_RngChecksum,
    //        rndFixedSeedActive);

    return x;
}

uint32_t CalcRandomNrForGameLogic(uint32_t l_limit, uint32_t u_limit) { return CalcRandomNr(l_limit, u_limit); }

uint32_t CalcRandomNrForCosmetics(uint32_t l_limit, uint32_t u_limit)
{
    // When a fixed seed is active, return the minimum value for cosmetic randomness
    // to ensure deterministic visual output without affecting the game logic RNG
    if (rndFixedSeedActive)
    {
        return l_limit;
    }

    // Use system rand() for cosmetics to avoid touching the Game Logic seed
    // This provides complete isolation
    int r = rand();
    uint32_t x = l_limit + (r % (u_limit - l_limit));
    return x;
}

uint32_t rndGetChecksum(void) { return g_RngChecksum; }
