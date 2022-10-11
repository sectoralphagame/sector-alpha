export function pickRandomWithIndex<T>(arr: T[]): [T, number] {
  const index = Math.floor(Math.random() * arr.length);
  return [arr[index], index];
}

export function pickRandom<T>(arr: T[]): T {
  return pickRandomWithIndex(arr)[0];
}
