import Mustache from "mustache";
import type { Reward } from "@core/components/missions";
import { relationThresholds } from "@core/components/relations";
import settings from "@core/settings";
import type { Sim } from "@core/sim";
import { Cooldowns } from "@core/utils/cooldowns";
import { pickRandom } from "@core/utils/generators";
import { randomInt } from "mathjs";
import { formatTime } from "@core/utils/format";
import { System } from "../system";
import type { MissionHandler } from "./types";
import missions from "../../world/data/missions.json";
import { patrolMission } from "./patrol";

Mustache.escape = (text) => text;

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
    this.cooldowns.use("track", 1);

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
      this.sim.getTime() > 5 * 60 + settings.bootTime &&
      player.cp.missions.offer === null
    ) {
      const faction = pickRandom(
        this.sim.queries.ai
          .get()
          .filter(
            (f) =>
              player.cp.relations.values[f.id] >= relationThresholds.mission
          )
      );
      if (!faction) return;

      const sector = pickRandom(
        this.sim.queries.sectors
          .get()
          .filter(
            (s) =>
              s.cp.owner?.id === faction.id &&
              !player.cp.missions.value.some(
                (mission) => mission.sectorId === s.id
              )
          )
      );
      const time = randomInt(1, 8) * 15 * 60;
      const reward = randomInt(80, 130) * 1000;

      const template = pickRandom(missions.patrol);
      const transform = (text: string) =>
        Mustache.render(text, {
          faction: faction.cp.name.value,
          sector: sector.cp.name.value,
          time: formatTime(time),
          reward,
        });

      player.cp.missions.offer = {
        title: transform(template.title),
        prompt: transform(template.prompt),
        actorName: "Local Police",
        responses: template.responses.map((r) => ({
          next: transform(r.next),
          text: transform(r.text),
          actor: "player",
          type: r.type as "accept" | "decline" | "neutral",
        })),
        data: patrolMission(sector.id, time, faction.id, {
          title: transform(template.title),
          description: transform(template.description),
          rewards: [
            { type: "money", amount: reward },
            { type: "relation", amount: 1.5, factionId: faction.id },
          ],
        }),
      };
    }
  };

  exec = (delta: number) => {
    this.cooldowns.update(delta);

    this.generate();
    this.track();
  };
}
