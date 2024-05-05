import type { Mission } from "@core/components/missions";
import { filter, first, pipe, some, toArray } from "@fxts/core";
import type { Sim } from "@core/sim";
import { randomInt } from "mathjs";
import { gameDay } from "@core/utils/misc";
import { mustacheConversation, pickRandom } from "@core/utils/generators";
import { formatGameTime } from "@core/utils/format";
import { relationThresholds } from "@core/components/relations";
import type { Sector } from "@core/archetypes/sector";
import conversationTemplate from "../../../world/data/missions/generic/patrol.yml";
import type { MissionHandler } from "../types";
import { moneyReward, relationReward } from "../rewards";

interface GenericPatrolMissionData {
  sectorId: number;
  currentTime: number;
  targetTime: number;
}

interface GenericPatrolMission extends Mission {
  data: GenericPatrolMissionData;
  type: "generic.patrol";
}

export const isGenericPatrolMission = (
  mission: Mission
): mission is GenericPatrolMission => mission.type === "generic.patrol";

export const genericPatrolMissionHandler: MissionHandler = {
  generate: (sim) => {
    const player = first(sim.queries.player.getIt())!;
    const faction = pickRandom(
      pipe(
        sim.queries.ai.get(),
        filter(
          (f) => player.cp.relations.values[f.id] >= relationThresholds.mission
        ),
        toArray
      )
    );
    const sector = pickRandom(
      pipe(
        sim.queries.sectors.get(),
        filter((s) => s.cp.owner?.id === faction.id),
        toArray
      )
    );
    const data: GenericPatrolMissionData = {
      currentTime: 0,
      targetTime: randomInt(7, 21) * gameDay,
      sectorId: sector.id,
    };
    const conversation = mustacheConversation(conversationTemplate, {
      time: formatGameTime(data.targetTime, "full"),
      sector: sector.cp.name.value,
    });

    return {
      conversation,
      data,
      immediate: false,
      rewards: [
        moneyReward(Math.round((((15 / 7) * data.targetTime) / gameDay) * 1e3)),
        relationReward(1, faction.id),
      ],
      type: "generic.patrol",
    };
  },
  accept: (sim, offer): GenericPatrolMission => {
    const data = offer.data as GenericPatrolMissionData;
    const sector = sim.getOrThrow<Sector>(data.sectorId);

    return {
      data,
      title: `Patrol ${sector.cp.name.value}`,
      cancellable: true,
      description: `Governor of ${
        sector.cp.name.value
      } requested help with patrolling their space for ${formatGameTime(
        data.targetTime
      )}.`,
      rewards: offer.rewards,
      accepted: sim.getTime(),
      type: "generic.patrol",
      references: [
        {
          id: sector.id,
          name: sector.cp.name.value,
        },
      ],
    };
  },
  isFailed: (mission, _sim) => {
    if (!isGenericPatrolMission(mission))
      throw new Error("Mission is not a generic.patrol mission");

    return false;
  },
  isCompleted: (mission: Mission, _sim) => {
    if (!isGenericPatrolMission(mission))
      throw new Error("Mission is not a generic.patrol mission");

    return mission.data.currentTime >= mission.data.targetTime;
  },
  update: (mission: Mission, sim: Sim, delta) => {
    if (!isGenericPatrolMission(mission))
      throw new Error("Mission is not a generic.patrol mission");

    const player = first(sim.queries.player.getIt())!;
    const patrolling = some(
      (s) =>
        s.cp.owner.id === player.id &&
        s.cp.orders.value[0]?.type === "patrol" &&
        s.cp.orders.value[0].sectorId === mission.data.sectorId &&
        s.cp.position.sector === mission.data.sectorId,
      sim.queries.ships.getIt()
    );

    if (patrolling) {
      mission.data.currentTime += delta;
    }
  },
  formatProgress: (mission: GenericPatrolMission) =>
    `${formatGameTime(mission.data.currentTime)} / ${formatGameTime(
      mission.data.targetTime
    )}`,
};
