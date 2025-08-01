export function lazy<T>(getter: () => T) {
  let v: T;
  return () => (v ??= getter());
}

export function asArray<T>(v: T | T[]) {
  return Array.isArray(v) ? v : [v];
}
