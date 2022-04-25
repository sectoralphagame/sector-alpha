import { Sim } from "../sim";
import { RequireComponent } from "../tsHelpers";

type Child = RequireComponent<"parent">;

export class Children {
  value: Child[] = [];
  ids: number[] = [];

  load = (sim: Sim) => {
    this.value = this.ids.map(
      (id) => sim.entities.find((e) => e.id === id) as Child
    );
  };

  add = (child: Child) => {
    this.value.push(child);
    this.ids.push(child.id);
  };

  remove = (id: number) => {
    this.value = this.value.filter((e) => e.id !== id);
    this.ids = this.ids.filter((e) => e !== id);
  };
}
