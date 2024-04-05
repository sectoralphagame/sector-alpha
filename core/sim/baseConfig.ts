import { isDev } from "@core/settings";
import { FacilityPlanningSystem } from "@core/systems/ai/facilityPlanning";
import { MilitaryModuleSpottingSystem } from "@core/systems/ai/militaryModuleSpotting";
import { OrderPlanningSystem } from "@core/systems/ai/orderPlanning";
import { ShipPlanningSystem } from "@core/systems/ai/shipPlanning";
import { ShipReturningSystem } from "@core/systems/ai/shipReturning";
import { SpottingSystem } from "@core/systems/ai/spotting";
import { TauHarassingSystem } from "@core/systems/ai/tauHarassing";
import { AsteroidSpawningSystem } from "@core/systems/asteroidSpawning";
import { AttackingSystem } from "@core/systems/attacking";
import { BudgetPlanningSystem } from "@core/systems/budgetPlanning";
import { CollectibleUnregisteringSystem } from "@core/systems/collectibleUnregistering";
import { CooldownUpdatingSystem } from "@core/systems/cooldowns";
import { CrewGrowingSystem } from "@core/systems/crewGrowing";
import { DeadUnregisteringSystem } from "@core/systems/deadUnregistering";
import { DisposableUnregisteringSystem } from "@core/systems/disposableUnregistering";
import { FacilityBuildingSystem } from "@core/systems/facilityBuilding";
import { HitpointsRegeneratingSystem } from "@core/systems/hitpointsRegenerating";
import { InflationStatisticGatheringSystem } from "@core/systems/inflationStatisticGathering";
import { MiningSystem } from "@core/systems/mining";
import { MissionSystem } from "@core/systems/mission";
// import { destroyMissionHandler } from "@core/systems/mission/destroy";
import { mainFfwTutorialMinerMissionHandler } from "@core/systems/mission/main/ffw/tutorial-miner";
// import { patrolMissionHandler } from "@core/systems/mission/patrol";
import {
  moneyRewardHandler,
  relationRewardHandler,
} from "@core/systems/mission/rewards";
import { MovingSystem } from "@core/systems/moving";
import { NavigatingSystem } from "@core/systems/navigating";
import { OrderExecutingSystem } from "@core/systems/orderExecuting/orderExecuting";
import { PathPlanningSystem } from "@core/systems/pathPlanning";
import { PirateSpawningSystem } from "@core/systems/pirateSpawning";
import { ProducingSystem } from "@core/systems/producing";
import { AvgFrameReportingSystem } from "@core/systems/reporting/avgFrameReporting";
import { SectorStatisticGatheringSystem } from "@core/systems/sectorStatisticGathering";
import { SelectingSystem } from "@core/systems/selecting";
import { ShipBuildingSystem } from "@core/systems/shipBuilding";
import { StorageQuotaPlanningSystem } from "@core/systems/storageQuotaPlanning";
import { TradingSystem } from "@core/systems/trading";
import { UndeployingSystem } from "@core/systems/undeploying";
import { FogOfWarUpdatingSystem } from "@core/systems/fogOfWarUpdating";
import type { SimConfig } from "./Sim";

export const bootstrapSystems = [
  new PathPlanningSystem(),
  new CooldownUpdatingSystem(),
  new ProducingSystem(),
  new StorageQuotaPlanningSystem(),
  new TradingSystem(),
  new BudgetPlanningSystem(),
  new OrderPlanningSystem(),
  new NavigatingSystem(),
  new MovingSystem(),
  new MiningSystem(),
  new OrderExecutingSystem(),
  new AsteroidSpawningSystem(),
  new FacilityPlanningSystem(),
  new ShipPlanningSystem(),
  new SectorStatisticGatheringSystem(),
  new InflationStatisticGatheringSystem(),
  new ShipBuildingSystem(),
  new FacilityBuildingSystem(),
  new ShipReturningSystem(),
  new DisposableUnregisteringSystem(),
  new CrewGrowingSystem(),
];

export const createBaseConfig = (): SimConfig => {
  const config: SimConfig = {
    systems: [
      ...bootstrapSystems,
      new SelectingSystem(),
      new UndeployingSystem(),
      new AttackingSystem(),
      new SpottingSystem(),
      new MilitaryModuleSpottingSystem(),
      new HitpointsRegeneratingSystem(),
      new TauHarassingSystem(),
      new DeadUnregisteringSystem(),
      new CollectibleUnregisteringSystem(),
      new MissionSystem(
        {
          // patrol: patrolMissionHandler,
          // destroy: destroyMissionHandler,
          "main.ffw.tutorial.miner": mainFfwTutorialMinerMissionHandler,
        },
        {
          money: moneyRewardHandler,
          relation: relationRewardHandler,
        }
      ),
      new PirateSpawningSystem(),
      new FogOfWarUpdatingSystem(),
    ],
  };

  if (isDev) {
    config.systems.push(new AvgFrameReportingSystem());
  }

  return config;
};
