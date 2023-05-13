export function pickRandomWithIndex<T>(arr: readonly T[]): [T, number] {
  const index = Math.floor(Math.random() * arr.length);
  return [arr[index], index];
}

export function pickRandom<T>(arr: readonly T[]): T {
  return pickRandomWithIndex(arr)[0];
}
