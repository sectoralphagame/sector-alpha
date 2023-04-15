import type { Sim } from "@core/sim";
import { Cooldowns } from "@core/utils/cooldowns";
import { pickRandom } from "@core/utils/generators";
import settings from "@core/settings";
import { System } from "./system";
import missions from "../world/data/missions.json";

export class MissionGeneratingSystem extends System {
  cooldowns: Cooldowns<"exec">;

  constructor() {
    super();
    this.cooldowns = new Cooldowns("exec");
  }

  exec = (delta: number) => {
    this.cooldowns.update(delta);
    if (!this.cooldowns.canUse("exec")) return;
    this.cooldowns.use("exec", 5 * 60);

    const player = this.sim.queries.player.get()[0];

    if (
      player.cp.missions.value.length < 3 &&
      this.sim.getTime() > 5 * 60 + settings.bootTime &&
      player.cp.missions.offer === null
    ) {
      const faction = pickRandom(
        this.sim.queries.ai
          .get()
          .filter((f) => player.cp.relations.values[f.id] > 0)
      );
      const template = pickRandom(missions.patrol);

      player.cp.missions.offer = {
        ...template,
        actorName: "Local Police",
        responses: template.responses.map((r) => ({
          ...r,
          actor: "player",
          type: r.type as "accept" | "decline" | "neutral",
        })),
      };
    }
  };

  apply = (sim: Sim): void => {
    super.apply(sim);
    sim.hooks.phase.update.tap(this.constructor.name, this.exec);
  };
}
