/**
 * Allow throwing an error in expressions
 * @usageNotes
 * ```typescript
 * function getUser(): User | null;
 *
 * const user = getUser() ?? throwIt('No user');
 * console.log(user.name); // No more: is possibly 'null'
 * ```
 */
export function throwIt<T>(error: unknown): NonNullable<T> {
  throw typeof error === 'string' ? new Error(error) : error;
}
