import type { Mission, MissionCommon } from "@core/components/missions";
import type { Sim } from "@core/sim";
import type { MissionHandler } from "./types";

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
  isFailed: () => false,
  isCompleted: (mission: Mission) => {
    if (!isPatrolMission(mission))
      throw new Error("Mission is not a patrol mission");

    return mission.elapsed >= mission.time;
  },
  update: (mission: Mission, sim: Sim) => {
    if (!isPatrolMission(mission))
      throw new Error("Mission is not a patrol mission");

    const isPatrolling = sim.queries.ships
      .get()
      .some(
        (ship) =>
          ship.cp.owner?.id === sim.queries.player.get()[0]!.id &&
          ship.cp.autoOrder?.default.type === "patrol" &&
          ship.cp.autoOrder.default.sectorId === mission.sector
      );
    if (isPatrolling) mission.elapsed += 1;
  },
};
