/** Get all object properties of the specified type
 * @usageNotes
 * ```typescript
 * class Some {
 *   prop1: number;
 *   prop2: number;
 *   prop3: string;
 * }
 *
 * type OnlyNumbers = OfType<Some, number>; // "prop1" | "prop2"
 * ```
 */
export type OfType<T, PropertyType> = { [K in keyof T]: T[K] extends PropertyType ? K : never }[keyof T];
