/**
 * Allow throwing an error in expressions
 * ```typescript
 * function getUser(): User | null;
 *
 * const user = getUser() ?? throwIt('No user');
 * console.log(user.name); // No more: is possibly 'null'
 * ```
 */
export function throwIt<E extends string | Error>(error: E): never {
  throw typeof error === 'string' ? new Error(error) : error;
}
