import { ObservableInput, from, of, tap } from 'rxjs';

export function cached<K, R>(
  action: (key: K) => ObservableInput<R>,
  expired: (i: R) => boolean,
  cache = new Map<K, R>() // can be used for the initialization
) {
  return (key: K) => (cache.has(key) && !expired(cache.get(key)!) ? of(cache.get(key)) : from(action(key)).pipe(tap(item => cache.set(key, item))));
}
