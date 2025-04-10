import type { Camera } from "./camera";
import type { Budget } from "./budget";
import type { Owner } from "./owner";
import type { Trade } from "./trade";
import type { CommodityStorage, SimpleCommodityStorage } from "./storage";
import type { Position } from "./position";
import type { CompoundProduction, Production } from "./production";
import type { Parent } from "./parent";
import type { FacilityModuleBonus } from "./facilityModuleBonus";
import type { Modules } from "./modules";
import type { Name } from "./name";
import type { Render } from "./render";
import type { AutoOrder } from "./autoOrder";
import type { Drive } from "./drive";
import type { Mining } from "./mining";
import type { Minable } from "./minable";
import type { Mineable } from "./mineable";
import type { Children } from "./children";
import type { Orders } from "./orders";
import type { HECSPosition } from "./hecsPosition";
import type { Teleport } from "./teleport";
import type { Docks, Dockable } from "./dockable";
import type { Commander } from "./commander";
import type { Color } from "./color";
import type { Ai } from "./ai";
import type { SectorStats } from "./sectorStats";
import type { SystemManager } from "./systemManager";
import type { InflationStats } from "./inflationStats";
import type { Shipyard } from "./shipyard";
import type { Blueprints } from "./blueprints";
import type { Journal } from "./journal";
import type { Deployable } from "./deployable";
import type { FacilityModuleQueue } from "./facilityModuleQueue";
import type { Builder } from "./builder";
import type { Relations } from "./relations";
import type { HitPoints } from "./hitpoints";
import type { Damage } from "./damage";
import type { Model } from "./model";
import type { Disposable } from "./disposable";
import type { Subordinates } from "./subordinates";
import type { CreationDate } from "./creationDate";
import type { Missions } from "./missions";
import type { Crew } from "./crew";
import type { CrewRequirement } from "./crewRequirement";
import type { Movable } from "./movable";
import type { StorageTransfer } from "./storageTransfer";
import type { Policies } from "./policies";

export interface CoreComponents {
  ai: Ai;
  mineable: Mineable;
  autoOrder: AutoOrder;
  blueprints: Blueprints;
  budget: Budget;
  builder: Builder;
  camera: Camera;
  children: Children;
  color: Color;
  commander: Commander;
  compoundProduction: CompoundProduction;
  creationDate: CreationDate;
  crew: Crew;
  crewRequirement: CrewRequirement;
  damage: Damage;
  deployable: Deployable;
  disposable: Disposable;
  dockable: Dockable;
  docks: Docks;
  drive: Drive;
  facilityModuleBonus: FacilityModuleBonus;
  facilityModuleQueue: FacilityModuleQueue;
  hecsPosition: HECSPosition;
  hitpoints: HitPoints;
  inflationStats: InflationStats;
  journal: Journal;
  /**
   * @deprecated
   */
  minable: Minable;
  mining: Mining;
  missions: Missions;
  model: Model;
  modules: Modules;
  movable: Movable;
  name: Name;
  orders: Orders;
  owner: Owner;
  parent: Parent;
  policies: Policies;
  position: Position;
  production: Production;
  relations: Relations;
  render: Render;
  sectorStats: SectorStats;
  shipyard: Shipyard;
  simpleCommodityStorage: SimpleCommodityStorage;
  storage: CommodityStorage;
  storageTransfer: StorageTransfer;
  subordinates: Subordinates;
  systemManager: SystemManager;
  teleport: Teleport;
  trade: Trade;
}

/**
 * Base interface for any component. Due to serialization and deserialization
 * problems it's required for a component to be composed only of literal
 * (not class) objects.
 */
export type BaseComponent<T extends string> = { name: T };
