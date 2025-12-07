/**
 * Type utilities for automatic TranslationKey generation
 * 
 * This file provides utilities to automatically generate TranslationKey types
 * from the dictionary objects, eliminating the need for manual union type maintenance.
 */

/**
 * Flattens a flat object structure (Record<string, string>) into string keys
 * 
 * Since our dictionary is already flat (e.g., { "features": "...", "features.section1.title": "..." }),
 * we just need to extract the keys directly.
 * 
 * Example:
 * {
 *   "features": "...",
 *   "features.section1.title": "..."
 * }
 * 
 * Becomes: "features" | "features.section1.title"
 */
export type FlattenKeys<T> = T extends Record<string, any>
	? keyof T & string
	: never;

/**
 * Extracts all keys from a dictionary object as a union type
 * 
 * This automatically generates TranslationKey from the actual dictionary structure
 */
export type ExtractKeys<T> = FlattenKeys<T>;

