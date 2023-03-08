import { groupBy } from "lodash";
import { sum } from "mathjs";
import type { Sector } from "../archetypes/sector";
import type { Commodity } from "../economy/commodity";
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
): Record<Commodity, SectorResources> {
  const neighbors = getSectorsInTeleportRange(
    sector,
    neighbourhood,
    sector.sim
  ).filter((e) => e.cp.owner?.id !== sector.cp.owner?.id);
  const fields = sector.sim.queries.asteroidFields
    .get()
    .filter((field) =>
      [sector.id, ...neighbors.map((e) => e.id)].includes(
        field.cp.position.sector
      )
    );
  const fieldsByType = groupBy(fields, (field) => field.cp.asteroidSpawn.type);

  return perCommodity((commodity) => ({
    available:
      fieldsByType[commodity]
        ?.map((field) => field.cp.children.entities)
        .flat()
        .map(sector.sim.getOrThrow)
        .reduce(
          (acc, a) =>
            acc + a.requireComponents(["minable"]).cp.minable.resources,
          0
        ) ?? 0,
    max:
      fieldsByType[commodity]?.reduce(
        (max, field) =>
          max +
          field.cp.asteroidSpawn.density * field.cp.asteroidSpawn.size ** 2,
        0
      ) ?? 0,
  }));
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
