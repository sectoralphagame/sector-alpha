import type { Reward } from "@core/components/missions";
import type { Sim } from "@core/sim";
import { Cooldowns } from "@core/utils/cooldowns";
import { System } from "../system";
import type { MissionHandler } from "./types";

type MissionHandlers = Record<string, MissionHandler>;

export class MissionTrackingSystem extends System {
  cooldowns: Cooldowns<"exec">;
  handlers: {
    mission: MissionHandlers;
    rewards: Record<string, (_reward: Reward, _sim: Sim) => void>;
  };

  constructor(
    missionHandlers: MissionHandlers,
    rewardHandlers: Record<string, (_reward: Reward, _sim: Sim) => void>
  ) {
    super();
    this.cooldowns = new Cooldowns("exec");
    this.handlers = {
      mission: missionHandlers,
      rewards: rewardHandlers,
    };
  }

  apply(sim: Sim): void {
    super.apply(sim);

    sim.hooks.phase.update.tap(this.constructor.name, this.exec);
  }

  exec = (delta: number) => {
    this.cooldowns.update(delta);
    if (!this.cooldowns.canUse("exec")) return;
    this.cooldowns.use("exec", 1);

    const player = this.sim.queries.player.get()[0]!;

    player.cp.missions.value.forEach((mission) => {
      this.handlers.mission[mission.type].update(mission, this.sim);

      if (this.handlers.mission[mission.type].isFailed(mission)) {
        player.cp.missions.value = player.cp.missions.value.filter(
          (m) => m !== mission
        );
      }

      if (this.handlers.mission[mission.type].isCompleted(mission)) {
        mission.rewards.forEach((reward) => {
          this.handlers.rewards[reward.type](reward, this.sim);
        });
        player.cp.missions.value = player.cp.missions.value.filter(
          (m) => m !== mission
        );
      }
    });
  };
}
