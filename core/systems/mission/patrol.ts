import Mustache from "mustache";
import type { Mission, MissionCommon } from "@core/components/missions";
import { relationThresholds } from "@core/components/relations";
import type { Sim } from "@core/sim";
import { pickRandom } from "@core/utils/generators";
import { randomInt } from "mathjs";
import { formatTime } from "@core/utils/format";
import { filter, first, pipe, some, toArray } from "@fxts/core";
import type { MissionHandler } from "./types";
import missions from "../../world/data/missions.json";

Mustache.escape = (text) => text;

interface PatrolMission extends Mission {
  elapsed: number;
  type: "patrol";
  sector: number;
  time: number;
  faction: number;
}

export const patrolMission = (
  sector: number,
  time: number,
  faction: number,
  common: MissionCommon
): PatrolMission => ({
  ...common,
  elapsed: 0,
  sector,
  time,
  type: "patrol",
  faction,
});

const isPatrolMission = (mission: Mission): mission is PatrolMission =>
  mission.type === "patrol";

export const patrolMissionHandler: MissionHandler = {
  generate: (sim) => {
    const player = first(sim.queries.player.getIt())!;
    const faction = pipe(
      sim.queries.ai.getIt(),
      filter(
        (f) => player.cp.relations.values[f.id] >= relationThresholds.mission
      ),
      toArray,
      pickRandom
    );
    if (!faction) return null;

    const sector = pickRandom(
      sim.queries.sectors
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

    return {
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
        accepted: sim.getTime(),
        title: transform(template.title),
        description: transform(template.description),
        rewards: [
          { type: "money", amount: reward },
          { type: "relation", amount: 1.5, factionId: faction.id },
        ],
      }),
    };
  },
  isFailed: () => false,
  isCompleted: (mission: Mission) => {
    if (!isPatrolMission(mission))
      throw new Error("Mission is not a patrol mission");

    return mission.elapsed >= mission.time;
  },
  update: (mission: Mission, sim: Sim) => {
    if (!isPatrolMission(mission))
      throw new Error("Mission is not a patrol mission");

    const player = first(sim.queries.player.getIt())!;

    const isPatrolling = some(
      (ship) =>
        ship.cp.owner?.id === player.id &&
        ship.cp.autoOrder?.default.type === "patrol" &&
        ship.cp.autoOrder.default.sectorId === mission.sector,
      sim.queries.ships.getIt()
    );
    if (isPatrolling) mission.elapsed += 1;
  },
};
