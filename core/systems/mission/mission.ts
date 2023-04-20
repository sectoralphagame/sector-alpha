import type { Reward } from "@core/components/missions";
import type { Sim } from "@core/sim";
import { Cooldowns } from "@core/utils/cooldowns";
import { pickRandom } from "@core/utils/generators";
import { randomInt } from "mathjs";
import { formatTime } from "@core/utils/format";
import { System } from "../system";
import type { MissionHandler } from "./types";

type MissionHandlers = Record<string, MissionHandler>;

export class MissionSystem extends System {
  cooldowns: Cooldowns<"generate" | "track">;
  handlers: {
    mission: MissionHandlers;
    rewards: Record<string, (_reward: Reward, _sim: Sim) => void>;
  };

  constructor(
    missionHandlers: MissionHandlers,
    rewardHandlers: Record<string, (_reward: Reward, _sim: Sim) => void>
  ) {
    super();
    this.cooldowns = new Cooldowns("generate", "track");
    this.handlers = {
      mission: missionHandlers,
      rewards: rewardHandlers,
    };
  }

  apply(sim: Sim): void {
    super.apply(sim);

    sim.hooks.phase.update.tap(this.constructor.name, this.exec);
  }

  track = () => {
    if (!this.cooldowns.canUse("track")) return;
    this.cooldowns.use("track", 1 + Math.random());

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

  generate = () => {
    if (!this.cooldowns.canUse("generate")) return;
    this.cooldowns.use("generate", 1 + Math.random());

    const player = this.sim.queries.player.get()[0];

    if (
      player.cp.missions.value.length < 3 &&
      this.sim.getTime() -
        Math.max(
          ...player.cp.missions.value.map((m) => m.accepted),
          player.cp.missions.declined
        ) >
        5 * 60 &&
      player.cp.missions.offer === null
    ) {
      pickRandom(Object.values(this.handlers.mission)).generate(this.sim);
    }
  };

  exec = (delta: number) => {
    this.cooldowns.update(delta);

    this.generate();
    this.track();
  };
}
