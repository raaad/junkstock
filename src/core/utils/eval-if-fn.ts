export function evalIfFn<T extends unknown[], R>(v: R | ((...i: T) => R), ...i: T) {
  return typeof v === 'function' ? (v as (...i: T) => R)(...i) : v;
}
