import { Faction } from "../economy/faction";

export class Owner {
  value: Faction | null = null;

  constructor(value: Faction | null = null) {
    if (value) {
      this.set(value);
    }
  }

  set = (value: Faction) => {
    this.value = value;
  };
  clear = () => {
    this.value = null;
  };
}
