/*  _________  _______
   / ___/ __ \/ __/ _ \      Der Clou!
  / /__/ /_/ /\ \/ ___/ Open Source Project
  \___/\____/___/_/ http://cosp.sourceforge.net
   Based on the original by neo Software GmbH
*/

/**
 * Random number generator module - TypeScript port of random.c
 * Uses MSVC-compatible LCG for deterministic random number generation
 */

// Module state (mirrors C static variables)
let rndFixedSeedActive = 0;
let g_RngChecksum = 0;
let g_my_seed = 0;

/**
 * Initialize RNG with time-based seed
 */
export function rndInit(): void {
    // printf("DEBUG: rndInit() called (time-based seed)\n");
    g_my_seed = Date.now() >>> 0; // Convert to uint32
    rndFixedSeedActive = 0;
}

/**
 * Initialize RNG with a specific seed for deterministic behavior
 * @param seed - The seed value to use
 */
export function rndInitWithSeed(seed: number): void {
    // printf("DEBUG: rndInitWithSeed(%u) - Setting custom RNG state\n", seed);
    g_my_seed = seed >>> 0; // Convert to uint32
    g_RngChecksum = 0;
    rndFixedSeedActive = 1;
}

/**
 * Internal LCG implementation
 * Formula: MSVC equivalent (seed = seed * 214013 + 2531011)
 * Returns 15-bit value (0-32767) to mimic standard rand() behavior
 */
function my_rand(): number {
    // Use BigInt for the multiplication to avoid JS number precision issues,
    // then convert back to uint32
    g_my_seed = ((g_my_seed * 214013 + 2531011) >>> 0);
    return (g_my_seed >>> 16) & 0x7FFF;
}

/**
 * Calculate a random number within the given range [l_limit, u_limit)
 * @param l_limit - Lower limit (inclusive)
 * @param u_limit - Upper limit (exclusive)
 * @returns Random number in range
 */
export function CalcRandomNr(l_limit: number, u_limit: number): number {
    // Use our custom, isolated RNG
    const r = my_rand();

    const x = l_limit + (r % (u_limit - l_limit));

    g_RngChecksum ^= x;

    // printf("RNG: %d [%d-%d] RAW: %d Checksum: %x (FixedSeed: %d)\n", x, l_limit, u_limit, r, g_RngChecksum,
    //        rndFixedSeedActive);

    return x;
}

/**
 * Calculate random number for game logic (uses deterministic RNG)
 * @param l_limit - Lower limit (inclusive)
 * @param u_limit - Upper limit (exclusive)
 * @returns Random number in range
 */
export function CalcRandomNrForGameLogic(l_limit: number, u_limit: number): number {
    return CalcRandomNr(l_limit, u_limit);
}

/**
 * Calculate random number for cosmetics (non-deterministic when fixed seed active)
 * @param l_limit - Lower limit (inclusive)
 * @param u_limit - Upper limit (exclusive)
 * @returns Random number in range
 */
export function CalcRandomNrForCosmetics(l_limit: number, u_limit: number): number {
    // When a fixed seed is active, return the minimum value for cosmetic randomness
    // to ensure deterministic visual output without affecting the game logic RNG
    if (rndFixedSeedActive) {
        return l_limit;
    }

    // Use Math.random() for cosmetics to avoid touching the Game Logic seed
    // This provides complete isolation
    const r = Math.floor(Math.random() * 0x7FFF);
    const x = l_limit + (r % (u_limit - l_limit));
    return x;
}

/**
 * Get the current RNG checksum (for debugging/verification)
 * @returns Current checksum value
 */
export function rndGetChecksum(): number {
    return g_RngChecksum;
}

/**
 * Check if fixed seed mode is active
 * @returns true if fixed seed is active
 */
export function rndIsFixedSeedActive(): boolean {
    return rndFixedSeedActive !== 0;
}

/**
 * Get current seed value (for debugging)
 * @returns Current seed
 */
export function rndGetCurrentSeed(): number {
    return g_my_seed;
}
