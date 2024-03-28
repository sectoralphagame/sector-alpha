import type { Reward } from "@core/components/missions";
import type { Sim } from "@core/sim";
import { pickRandom } from "@core/utils/generators";
import { first } from "@fxts/core";
import { System } from "../system";
import type { MissionHandler } from "./types";

type MissionHandlers = Record<string, MissionHandler>;

export class MissionSystem extends System<"generate" | "track"> {
  handlers: {
    mission: MissionHandlers;
    rewards: Record<string, (_reward: Reward, _sim: Sim) => void>;
  };

  constructor(
    missionHandlers: MissionHandlers,
    rewardHandlers: Record<string, (_reward: Reward, _sim: Sim) => void>
  ) {
    super();
    this.handlers = {
      mission: missionHandlers,
      rewards: rewardHandlers,
    };
  }

  apply(sim: Sim): void {
    super.apply(sim);

    sim.hooks.phase.update.subscribe(this.constructor.name, this.exec);

    this.sim.actions.register(
      {
        name: "Generate mission",
        slug: "generate",
        description: "Generate a new mission",
        category: "mission",
        type: "basic",
        fn: () => this.generate(true),
      },
      this.constructor.name
    );
  }

  track = () => {
    if (!this.cooldowns.canUse("track")) return;
    this.cooldowns.use("track", 1 + Math.random());

    const player = first(this.sim.queries.player.getIt())!;

    player.cp.missions.value.forEach((mission) => {
      this.handlers.mission[mission.type].update(mission, this.sim);
      mission.progress.label =
        this.handlers.mission[mission.type].formatProgress(mission);

      if (this.handlers.mission[mission.type].isFailed(mission, this.sim)) {
        player.cp.missions.value = player.cp.missions.value.filter(
          (m) => m !== mission
        );
      }

      if (this.handlers.mission[mission.type].isCompleted(mission, this.sim)) {
        mission.rewards.forEach((reward) => {
          this.handlers.rewards[reward.type](reward, this.sim);
        });
        player.cp.missions.value = player.cp.missions.value.filter(
          (m) => m !== mission
        );
      }
    });
  };

  generate = (force: boolean) => {
    if (!this.cooldowns.canUse("generate") && !force) return;
    this.cooldowns.use("generate", 1 + Math.random());

    const player = this.sim.queries.player.get()[0];

    if (
      ((player.cp.missions.value.length < 3 &&
        this.sim.getTime() -
          Math.max(
            ...player.cp.missions.value.map((m) => m.accepted),
            player.cp.missions.declined
          ) >
          5 * 60) ||
        force) &&
      player.cp.missions.offer === null
    ) {
      player.cp.missions.offer = pickRandom(
        Object.values(this.handlers.mission)
      ).generate(this.sim);
    }
  };

  exec = () => {
    this.generate(false);
    this.track();
  };
}
