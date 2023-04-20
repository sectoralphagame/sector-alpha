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
import { DeadUnregisteringSystem } from "@core/systems/deadUnregistering";
import { DisposableUnregisteringSystem } from "@core/systems/disposableUnregistering";
import { FacilityBuildingSystem } from "@core/systems/facilityBuilding";
import { HitpointsRegeneratingSystem } from "@core/systems/hitpointsRegenerating";
import { InflationStatisticGatheringSystem } from "@core/systems/inflationStatisticGathering";
import { MiningSystem } from "@core/systems/mining";
import { MissionSystem } from "@core/systems/mission";
import { patrolMissionHandler } from "@core/systems/mission/patrol";
import {
  moneyRewardHandler,
  relationRewardHandler,
} from "@core/systems/mission/rewards";
import { MovingSystem } from "@core/systems/moving";
import { NavigatingSystem } from "@core/systems/navigating";
import { OrderExecutingSystem } from "@core/systems/orderExecuting/orderExecuting";
import { PathPlanningSystem } from "@core/systems/pathPlanning";
import { ProducingSystem } from "@core/systems/producing";
import { SectorStatisticGatheringSystem } from "@core/systems/sectorStatisticGathering";
import { SelectingSystem } from "@core/systems/selecting";
import { ShipBuildingSystem } from "@core/systems/shipBuilding";
import { StorageQuotaPlanningSystem } from "@core/systems/storageQuotaPlanning";
import { TradingSystem } from "@core/systems/trading";
import { UndeployingSystem } from "@core/systems/undeploying";
import type { SimConfig } from "./Sim";

export const createBaseConfig = (): SimConfig => ({
  systems: [
    new PathPlanningSystem(),
    new CooldownUpdatingSystem(),
    new ProducingSystem(),
    new StorageQuotaPlanningSystem(),
    new TradingSystem(),
    new BudgetPlanningSystem(),
    new SelectingSystem(),
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
    new UndeployingSystem(),
    new AttackingSystem(),
    new SpottingSystem(),
    new MilitaryModuleSpottingSystem(),
    new HitpointsRegeneratingSystem(),
    new TauHarassingSystem(),
    new ShipReturningSystem(),
    new DisposableUnregisteringSystem(),
    new DeadUnregisteringSystem(),
    new CollectibleUnregisteringSystem(),
    new MissionSystem(
      {
        patrol: patrolMissionHandler,
      },
      {
        money: moneyRewardHandler,
        relation: relationRewardHandler,
      }
    ),
  ],
});
