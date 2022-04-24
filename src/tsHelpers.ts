import type { CoreComponents, Entity } from "./components/entity";

export type KeyOf<T> = keyof T;
export type Values<T> = T[keyof T];

export type RequireComponent<T extends keyof CoreComponents> = Entity & {
  components: Required<Pick<CoreComponents, T>> &
    Partial<Omit<CoreComponents, T>>;
};
