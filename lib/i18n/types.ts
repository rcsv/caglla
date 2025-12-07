/**
 * TranslationKey type is now automatically generated from the dictionary objects.
 * 
 * This eliminates the need for manual union type maintenance (previously 1838 lines!).
 * The type is inferred from the actual dictionary structure using FlattenKeys utility.
 * 
 * @see lib/i18n/types-utils.ts for the implementation
 */
import type en from "./en";
import type { FlattenKeys } from "./types-utils";

/**
 * Automatically generated TranslationKey type from the English dictionary
 * 
 * This type is automatically inferred from the structure of the `en` dictionary object.
 * When you add a new key to the dictionary, this type will automatically include it.
 * 
 * No manual maintenance required! 🎉
 * 
 * Previously: 1838 lines of manual union type
 * Now: Automatically generated from the actual dictionary structure
 */
export type TranslationKey = FlattenKeys<typeof en>;

/**
 * Dictionary type: maps TranslationKey to string values
 */
export type Dictionary = Record<TranslationKey, string>;
