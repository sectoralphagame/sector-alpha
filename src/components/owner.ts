import { Faction } from "../economy/faction";

export class Owner {
  value: Faction | null;

  constructor(value: Faction | null = null) {
    this.set(value);
  }

  set = (value: Faction) => {
    this.value = value;
  };
  clear = () => {
    this.value = null;
  };
}
