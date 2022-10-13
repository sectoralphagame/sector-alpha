export function notNull<T>(v: T | null): v is T {
  return v !== null;
}
