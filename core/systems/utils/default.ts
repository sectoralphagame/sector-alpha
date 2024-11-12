import { shipComponents } from "@core/archetypes/ship";
import { collectibleComponents } from "@core/archetypes/collectible";
import { asteroidFieldComponents } from "../../archetypes/asteroidField";
import { facilityComponents } from "../../archetypes/facility";
import { factionComponents } from "../../archetypes/faction";
import { sectorComponents } from "../../archetypes/sector";
import { tradeComponents } from "../../economy/utils";
import { SectorIndex } from "./sectorIndex";
import { EntityIndex } from "./entityIndex";

export const defaultIndexer = {
  ai: new EntityIndex([...factionComponents, "ai"]),
  asteroidFields: new EntityIndex(asteroidFieldComponents, [], true),
  autoOrderable: new EntityIndex(["autoOrder", "orders", "position"]),
  budget: new EntityIndex(["budget"], [], true),
  builders: new EntityIndex(["builder", "storage", "trade", "docks"]),
  children: new EntityIndex(["parent"]),
  collectibles: new EntityIndex(collectibleComponents, ["collectible"]),
  disposable: new EntityIndex(["disposable"]),
  facilities: new EntityIndex(
    ["modules", "position", "facilityModuleQueue", "subordinates", "render"],
    [],
    true
  ),
  facilityWithProduction: new EntityIndex([
    "compoundProduction",
    "modules",
    "position",
  ]),
  habitats: new EntityIndex(["parent", "facilityModuleBonus"]),
  mining: new EntityIndex(["mining", "storage"]),
  orderable: new EntityIndex(["orders", "position", "model", "owner"]),
  player: new EntityIndex([...factionComponents, "missions"], ["player"], true),
  productionByModules: new EntityIndex(["production", "parent"]),
  renderableGraphics: new EntityIndex(["renderGraphics"]),
  sectors: new EntityIndex(sectorComponents, [], true),
  selectable: new EntityIndex(["render", "position"], ["selection"]),
  settings: new EntityIndex(
    ["selectionManager", "systemManager", "inflationStats", "camera"],
    [],
    true
  ),
  ships: new EntityIndex(shipComponents, ["ship"], true),
  shipyards: new EntityIndex(
    [...facilityComponents, "owner", "shipyard"],
    [],
    true
  ),
  standaloneProduction: new EntityIndex(["production", "storage"]),
  storage: new EntityIndex(["storage"]),
  storageAndTrading: new EntityIndex(["storage", "trade"]),
  teleports: new EntityIndex(["teleport"], [], true),
  trading: new EntityIndex(tradeComponents),
  sectorTrading: new SectorIndex(tradeComponents),
};
