export function limitMax(value: number, threshold: number): number {
  return value > threshold ? threshold : value;
}

export function limitMin(value: number, threshold: number): number {
  return value < threshold ? threshold : value;
}

export function limit(value: number, min: number, max: number): number {
  return limitMax(limitMin(value, min), max);
}
