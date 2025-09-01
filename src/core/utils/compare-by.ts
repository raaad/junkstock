import { OfType } from '../types/utils';
import { lazy } from './lazy';

type Comparable = string | number | Date | boolean | undefined | null;

type Options = { desc?: boolean } & (
  | { collator: Intl.Collator }
  | { locales?: Intl.UnicodeBCP47LocaleIdentifier | Intl.UnicodeBCP47LocaleIdentifier[]; ignoreCase?: boolean }
);

/** Creates a compare function for use in array sorting
 * @param selector A function that returns a comparable value or one of the keys of a sorted item with a comparable type
 * ```
 * [{ id: 1 }, { id: 2 }].sort(compareBy(({ id }) => id));
 * [{ id: 1 }, { id: 2 }].sort(compareBy('id'));
 * ```
 */
export function compareBy<T, R extends Comparable>(selector: ((i: T) => R) | OfType<T, R>, { desc, ...options }: Options = {}) {
  const collator = lazy(() => ('collator' in options ? options.collator : defaultCollator(options.locales, options.ignoreCase)));
  const fn = typeof selector === 'function' ? selector : (i: T) => i[selector] as R;

  return (a: T, b: T) => {
    const a1 = narrow(fn(a));
    const b1 = narrow(fn(b));

    return (typeof a1 === 'number' ? a1 - (b1 as number) : collator().compare(a1, b1 as string)) * (desc ? -1 : 1);
  };
}

function narrow(i: Comparable) {
  return (
    i instanceof Date ? i.getTime()
    : typeof i === 'boolean' ? Number(i)
    : (i ?? 0)
  );
}

function defaultCollator(locales: Intl.UnicodeBCP47LocaleIdentifier | Intl.UnicodeBCP47LocaleIdentifier[] = 'en', ignoreCase = false) {
  return new Intl.Collator(locales, { numeric: true, sensitivity: ignoreCase ? 'accent' : 'variant' });
}
