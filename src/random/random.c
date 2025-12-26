/*  _________  _______
   / ___/ __ \/ __/ _ \      Der Clou!
  / /__/ /_/ /\ \/ ___/ Open Source Project
  \___/\____/___/_/ http://cosp.sourceforge.net
   Based on the original by neo Software GmbH
*/
#include "random/random.h"

static int rndFixedSeedActive = 0;

void rndInit(void)
{
#ifndef __COSP__
    randomize(); /* Zufallszahl über Timer initialisieren */
#else
    srand((unsigned int)time(NULL));
#endif
}

void rndInitWithSeed(unsigned int seed)
{
    srand(seed);
    rndFixedSeedActive = 1;
}

uint32_t CalcRandomNr(uint32_t l_limit, uint32_t u_limit)
{
    uint32_t x = l_limit + (rand() % (u_limit - l_limit));

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
    return CalcRandomNr(l_limit, u_limit);
}
