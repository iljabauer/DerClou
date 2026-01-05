/**
 * Helper utilities for game development
 */

/**
 * Format time as HH:MM
 */
export function formatTime(hour: number, minute: number): string {
    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
}

/**
 * Format money with currency symbol
 */
export function formatMoney(amount: number): string {
    return `£${amount.toLocaleString()}`;
}

/**
 * Clamp value between min and max
 */
export function clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
}

/**
 * Linear interpolation
 */
export function lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t;
}

/**
 * Check if value is within range
 */
export function inRange(value: number, min: number, max: number): boolean {
    return value >= min && value <= max;
}

/**
 * Get percentage as string
 */
export function toPercent(value: number, decimals: number = 0): string {
    return `${(value * 100).toFixed(decimals)}%`;
}

/**
 * Delay execution
 */
export function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Deep clone object
 */
export function deepClone<T>(obj: T): T {
    return JSON.parse(JSON.stringify(obj));
}

/**
 * Generate unique ID
 */
let idCounter = 0;
export function generateId(): number {
    return ++idCounter;
}

/**
 * Reset ID counter (for testing)
 */
export function resetIdCounter(): void {
    idCounter = 0;
}
