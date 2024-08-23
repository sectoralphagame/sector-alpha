import type { Sim } from "@core/sim";

export interface SimIndex<T> {
  apply(_sim: Sim): void;
  collect(): void;
  clear(): void;
  reset(): void;

  add(_a: T): void;
  remove(_a: T): void;
}
