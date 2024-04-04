import Mustache from "mustache";
import type { Mission, MissionCommon } from "@core/components/missions";
import { relationThresholds } from "@core/components/relations";
import type { Sim } from "@core/sim";
import { pickRandom } from "@core/utils/generators";
import { randomInt } from "mathjs";
import { formatGameTime } from "@core/utils/format";
import { filter, first, pipe, some, toArray } from "@fxts/core";
import type { Sector } from "@core/archetypes/sector";
import { gameDay } from "@core/utils/misc";
import type { MissionHandler } from "./types";
import missions from "../../world/data/missions.json";
import { getRelationFactor } from "./utils";

Mustache.escape = (text) => text;

interface PatrolMission extends Mission {
  type: "patrol";
  sector: number;
  faction: number;
}

export const patrolMission = (
  sector: number,
  time: number,
  faction: number,
  common: MissionCommon
): PatrolMission => ({
  ...common,
  sector,
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
    const weeks = randomInt(2, 4);
    const time = weeks * 7 * gameDay;
    const reward = Math.floor(weeks * getRelationFactor(faction) * 10000);

    const template = pickRandom(missions.patrol);
    const transform = (text: string) =>
      Mustache.render(text, {
        faction: faction.cp.name.value,
        sector: sector.cp.name.value,
        time: formatGameTime(time, "full"),
        reward,
      });

    return {
      title: transform(template.title),
      prompt: transform(template.prompt),
      actorName: template.actorName,
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
          // Add 1 relation point for every week of patrol
          {
            type: "relation",
            amount: time / (10 * 7 * gameDay),
            factionId: faction.id,
          },
        ],
        references: [{ id: sector.id, name: sector.cp.name.value }],
        progress: {
          current: 0,
          max: time,
        },
      }),
    };
  },
  isFailed: (mission: Mission, sim: Sim) => {
    if (!isPatrolMission(mission))
      throw new Error("Mission is not a patrol mission");

    return (
      sim.getOrThrow<Sector>(mission.sector).cp.owner?.id !== mission.faction
    );
  },
  isCompleted: (mission: Mission) => {
    if (!isPatrolMission(mission))
      throw new Error("Mission is not a patrol mission");

    return mission.progress.current >= mission.progress.max;
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
    if (isPatrolling) mission.progress.current += 1;
  },
  formatProgress: (mission: Mission) =>
    `${formatGameTime(mission.progress.max - mission.progress.current)} left`,
};
