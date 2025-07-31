export function* traverse<T, R>(
  selector: (current: T) => [value: R | null, next: T | null | undefined],
  item: T | null | undefined
): Generator<T, void, never> {
  while (item) {
    const [value, next] = selector(item);
    value !== null && (yield value as T);
    item = next;
  }
}
