import { Budget } from "./budget";
import { Owner } from "./owner";
import { Trade } from "./trade";
import { CommodityStorage } from "./storage";
import { Position } from "./position";
import { CompoundProduction, Production } from "./production";
import { Parent } from "./parent";
import { StorageBonus } from "./storageBonus";
import { Modules } from "./modules";
import { Name } from "./name";
import { Selection, SelectionManager } from "./selection";
import { Render } from "./render";
import { RenderGraphics } from "./renderGraphics";
import { AutoOrder } from "./autoOrder";
import { Drive } from "./drive";
import { Mining } from "./mining";
import { Minable } from "./minable";
import { AsteroidSpawn } from "./asteroidSpawn";
import { Children } from "./children";
import { Orders } from "./orders";
import { HECSPosition } from "./hecsPosition";
import { Teleport } from "./teleport";
import { Docks, Dockable } from "./dockable";
import { Commander } from "./commander";
import { Color } from "./color";
import { Ai } from "./ai";
import { DestroyAfterUsage } from "./destroyAfterUsage";
import { SectorStats } from "./sectorStats";
import { SystemManager } from "./systemManager";
import { InflationStats } from "./inflationStats";
import { Shipyard } from "./shipyard";
import { Blueprints } from "./blueprints";
import { Journal } from "./journal";
import { Player } from "./player";
import { Deployable } from "./deployable";
import { FacilityModuleQueue } from "./facilityModuleQueue";

export interface CoreComponents {
  ai: Ai;
  asteroidSpawn: AsteroidSpawn;
  autoOrder: AutoOrder;
  blueprints: Blueprints;
  budget: Budget;
  children: Children;
  color: Color;
  commander: Commander;
  compoundProduction: CompoundProduction;
  deployable: Deployable;
  destroyAfterUsage: DestroyAfterUsage;
  dockable: Dockable;
  docks: Docks;
  drive: Drive;
  facilityModuleQueue: FacilityModuleQueue;
  hecsPosition: HECSPosition;
  inflationStats: InflationStats;
  journal: Journal;
  minable: Minable;
  mining: Mining;
  modules: Modules;
  name: Name;
  orders: Orders;
  owner: Owner;
  parent: Parent;
  player: Player;
  position: Position;
  production: Production;
  render: Render;
  renderGraphics: RenderGraphics<any>;
  sectorStats: SectorStats;
  selection: Selection;
  selectionManager: SelectionManager;
  shipyard: Shipyard;
  storage: CommodityStorage;
  storageBonus: StorageBonus;
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
