export function lazy<T>(getter: () => T) {
  let v: T;
  const lazy = () => (v ??= getter());
  lazy.reset = () => (v = undefined as T);
  return lazy;
}
