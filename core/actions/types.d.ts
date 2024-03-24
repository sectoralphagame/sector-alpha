import type { Sim } from "@core/sim";

export type BaseAction = {
  slug: string;
  name: string;
  description: string;
  category: string;
};

export type BasicAction = BaseAction & {
  type: "basic";
  fn: (_sim: Sim) => void;
};

export type PlayerAction<TArgs extends any[]> = BaseAction & {
  variants: TArgs[];
  type: "player";
  fn: (_sim: Sim, ..._rest: TArgs) => void;
};

export type TargetAction<TArgs extends any[]> = BaseAction & {
  variants: TArgs[];
  type: "target";
  fn: (_sim: Sim, _targetId: number, ..._rest: TArgs) => void;
};

export type DevAction<TArgs extends any[] = any[]> =
  | PlayerAction<TArgs>
  | TargetAction<TArgs>
  | BasicAction;
