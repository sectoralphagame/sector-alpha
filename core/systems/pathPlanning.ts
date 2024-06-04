import { Graph, alg } from "graphlib";
import type { Sim } from "../sim";
import { findInAncestors } from "../utils/findInAncestors";
import { System } from "./system";

export function regen(sim: Sim) {
  const graph = new Graph({ directed: false });

  for (const t of sim.queries.teleports.getIt()) {
    graph.setNode(findInAncestors(t, "position").cp.position.sector.toString());
  }

  for (const t of sim.queries.teleports.getIt()) {
    graph.setEdge(
      findInAncestors(t, "position").cp.position.sector.toString(),
      findInAncestors(
        sim.getOrThrow(t.cp.teleport.destinationId!),
        "position"
      ).cp.position.sector.toString()
    );
  }

  sim.paths = alg.dijkstraAll(
    graph,
    () => 1,
    (v) => graph.nodeEdges(v)!
  );
}

export class PathPlanningSystem extends System<"regen"> {
  apply = (sim: Sim): void => {
    super.apply(sim);

    sim.hooks.phase.init.subscribe(this.constructor.name, this.exec);
    regen(this.sim);
  };

  exec = (): void => {
    if (this.cooldowns.canUse("regen")) {
      this.cooldowns.use("regen", 30 * 60);
      regen(this.sim);
    }
  };
}
