import { filter, pipe, toArray } from "@fxts/core";
import { sum } from "mathjs";
import { defaultIndexer } from "@core/systems/utils/default";
import type { Sector } from "../archetypes/sector";
import { type Commodity } from "../economy/commodity";
import { getSectorsInTeleportRange } from "../economy/utils";
import type { RequireComponent } from "../tsHelpers";
import { perCommodity } from "./perCommodity";

export interface SectorResources {
  available: number;
  max: number;
}

/**
 * Get current mineable resources in sector
 */
export function getSectorResources(
  sector: Sector,
  neighbourhood: number
): Record<Commodity, boolean> {
  const neighbors = pipe(
    getSectorsInTeleportRange(sector, neighbourhood, sector.sim),
    filter((e) => e.cp.owner?.id !== sector.cp.owner?.id),
    toArray
  );
  const sectorIds = [sector.id, ...neighbors.map((e) => e.id)];
  const fields = pipe(
    defaultIndexer.asteroidFields.getIt(),
    filter((field) => sectorIds.includes(field.cp.position.sector)),
    toArray
  );

  return perCommodity((commodity) =>
    fields.some((f) => f.cp.mineable.resources[commodity] > 0)
  );
}

/**
 * Get all commodities used by facilities
 */
export function getResourceUsage(
  facilities: Array<RequireComponent<"compoundProduction" | "modules">>
): Record<Commodity, number> {
  return perCommodity(
    (commodity) =>
      sum(
        facilities.flatMap((facility) =>
          facility.cp.compoundProduction.pac[commodity].consumes > 0
            ? facility.cp.modules.ids
                .map(facility.sim.get)
                .map((facilityModule) =>
                  facilityModule?.cp.production
                    ? facilityModule.cp.production.pac[commodity].consumes
                    : 0
                )
            : []
        )
      ) as number
  );
}

/**
 * Get all commodities produced by facilities
 */
export function getResourceProduction(
  facilities: Array<RequireComponent<"compoundProduction" | "modules">>
): Record<Commodity, number> {
  return perCommodity(
    (commodity) =>
      sum(
        facilities.flatMap((facility) =>
          facility.cp.compoundProduction.pac[commodity].produces > 0
            ? facility.cp.modules.ids
                .map(facility.sim.get)
                .map((facilityModule) =>
                  facilityModule?.cp.production
                    ? facilityModule.cp.production.pac[commodity].produces
                    : 0
                )
            : []
        )
      ) as number
  );
}
