import { Graph, alg } from "graphlib";
import { Sim } from "../sim";
import { Cooldowns } from "../utils/cooldowns";
import { findInAncestors } from "../utils/findInAncestors";
import { System } from "./system";

export function regen(sim: Sim) {
  const graph = new Graph({ directed: false });

  sim.queries.teleports.get().forEach((t) => {
    graph.setNode(findInAncestors(t, "position").cp.position.sector.toString());
  });

  sim.queries.teleports.get().forEach((t) => {
    graph.setEdge(
      findInAncestors(t, "position").cp.position.sector.toString(),
      findInAncestors(
        sim.get(t.cp.teleport.destinationId!),
        "position"
      ).cp.position.sector.toString()
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
