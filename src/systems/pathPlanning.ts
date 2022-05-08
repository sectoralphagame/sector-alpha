import { Graph, alg } from "graphlib";
import { Sim } from "../sim";
import { Cooldowns } from "../utils/cooldowns";
import { System } from "./system";

export function regen(sim: Sim) {
  const graph = new Graph({ directed: false });

  sim.queries.teleports.get().forEach((t) => {
    graph.setNode(
      t.cp
        .parent!.value.requireComponents(["position"])
        .cp.position.sectorId.toString()
    );
  });

  sim.queries.teleports.get().forEach((t) => {
    graph.setEdge(
      t.cp.parent!.value.cp.position!.sectorId.toString(),
      t.cp.teleport.destination.cp.parent!.value.cp.position!.sectorId.toString()
    );
  });

  sim.paths = alg.dijkstraAll(
    graph,
    () => 1,
    (v) => graph.nodeEdges(v)!
  );
}

export class PathPlanningSystem extends System {
  cooldowns: Cooldowns<"regen">;

  constructor(sim: Sim) {
    super(sim);
    this.cooldowns = new Cooldowns("regen");
  }

  exec = (delta: number): void => {
    this.cooldowns.update(delta);

    if (this.cooldowns.canUse("regen")) {
      this.cooldowns.use("regen", 5);
      regen(this.sim);
    }
  };
}
