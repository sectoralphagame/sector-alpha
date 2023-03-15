export function limitMax(value: number, threshold: number): number {
  return Math.min(value, threshold);
}

export function limitMin(value: number, threshold: number): number {
  return Math.max(value, threshold);
}

export function limit(value: number, min: number, max: number): number {
  return limitMax(limitMin(value, min), max);
}
