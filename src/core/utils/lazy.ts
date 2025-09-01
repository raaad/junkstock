export function lazy<T>(getter: () => T) {
  let v: T;
  return () => (v ??= getter());
}
