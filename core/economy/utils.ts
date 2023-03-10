import type { Matrix } from "mathjs";
import { norm, subtract } from "mathjs";
import type { FacilityModuleInput } from "@core/archetypes/facilityModule";
import { discriminate } from "@core/utils/maps";
import sortBy from "lodash/sortBy";
import minBy from "lodash/minBy";
import maxBy from "lodash/maxBy";
import {
  filter,
  map,
  pipe,
  toArray,
  average,
  sum as fxtsSum,
} from "@fxts/core";
import type { Faction } from "@core/archetypes/faction";
import { relationThresholds } from "@core/components/relations";
import type { Sim } from "../sim";
import type { Commodity } from "./commodity";
import { commoditiesArray } from "./commodity";
import type { RequireComponent } from "../tsHelpers";
import type { AsteroidField } from "../archetypes/asteroidField";
import type { Asteroid } from "../archetypes/asteroid";
import { asteroid } from "../archetypes/asteroid";
import type { Sector } from "../archetypes/sector";
import { sector as asSector } from "../archetypes/sector";
import type { Marker } from "../archetypes/marker";
import { perCommodity } from "../utils/perCommodity";
import { pickRandom } from "../utils/generators";

export const tradeComponents = [
  "trade",
  "storage",
  "budget",
  "position",
  "owner",
  "docks",
  "journal",
] as const;
export type WithTrade = RequireComponent<(typeof tradeComponents)[number]>;

export function getSectorsInTeleportRange(
  origin: Sector,
  jumps: number,
  sim: Sim
): Sector[] {
  const ids = Object.entries(sim.paths[origin.id.toString()] ?? {})
    .filter(([, path]) => path.distance <= jumps)
    .map(([id]) => parseInt(id, 10));
  return sim.queries.sectors.get().filter((sector) => ids.includes(sector.id));
}

export interface TradeWithMostProfit {
  buyer: WithTrade;
  seller: WithTrade;
  commodity: Commodity;
}

/**
 * Find commodity, seller and buyer in proximity that yields most
 * profitable trade
 */
export function getTradeWithMostProfit(
  from: Marker | Sector,
  sectorDistance: number,
  notAllowedFactions: number[]
): TradeWithMostProfit | null {
  const facilitiesInRange = getSectorsInTeleportRange(
    asSector(
      from.cp.hecsPosition
        ? from
        : from.sim.getOrThrow(
            from.requireComponents(["position"]).cp.position.sector
          )!
    ),
    sectorDistance,
    from.sim
  ).flatMap((sector) =>
    from.sim.queries.trading
      .get()
      .filter(
        (f) =>
          f.cp.position.sector === sector.id &&
          !notAllowedFactions.includes(f.cp.owner.id)
      )
  );

  const bestOffers = perCommodity((commodity) => ({
    // We buy, facility sells
    buy: minBy(
      pipe(
        facilitiesInRange,
        filter(
          (f) =>
            f.cp.trade.offers[commodity].active &&
            f.cp.trade.offers[commodity].type === "sell" &&
            f.cp.trade.offers[commodity].quantity > 0
        ),
        toArray
      ),
      (f) => f.cp.trade.offers[commodity].price
    ),
    sell: maxBy(
      pipe(
        facilitiesInRange,
        filter(
          (f) =>
            f.cp.trade.offers[commodity].active &&
            f.cp.trade.offers[commodity].type === "buy" &&
            f.cp.trade.offers[commodity].quantity > 0
        ),
        toArray
      ),
      (f) => f.cp.trade.offers[commodity].price
    ),
  }));

  const profits = pipe(
    commoditiesArray,
    map((commodity) => ({
      commodity,
      profit:
        bestOffers[commodity].sell && bestOffers[commodity].buy
          ? bestOffers[commodity].sell!.cp.trade.offers[commodity].price /
            bestOffers[commodity].buy!.cp.trade.offers[commodity].price
          : 0,
    })),
    filter(({ profit }) => profit > 1),
    toArray
  );

  if (profits.length === 0) {
    return null;
  }

  const commodityWithMostProfit = maxBy(profits, "profit")!
    .commodity as Commodity;

  return {
    buyer:
      bestOffers[commodityWithMostProfit].sell!.requireComponents(
        tradeComponents
      ),
    seller:
      bestOffers[commodityWithMostProfit].buy!.requireComponents(
        tradeComponents
      ),
    commodity: commodityWithMostProfit,
  };
}

export function getFacilityWithMostProfit(
  facility: WithTrade,
  commodity: Commodity,
  minQuantity: number,
  sectorDistance: number
): WithTrade | null {
  const distance = (f: WithTrade) =>
    norm(
      subtract(facility.cp.position.coord, f.cp.position.coord) as Matrix
    ) as number;

  const faction = facility.sim.getOrThrow<Faction>(facility.cp.owner.id);

  const profit = (f: WithTrade) =>
    f.cp.owner.id === facility.cp.owner.id
      ? Infinity
      : (facility.components.trade.offers[commodity].price -
          f.components.trade.offers[commodity].price) *
        (facility.components.trade.offers[commodity].type === "buy" ? 1 : -1);

  const sortedByProfit = sortBy(
    getSectorsInTeleportRange(
      asSector(facility.sim.getOrThrow(facility.cp.position.sector)!),
      sectorDistance,
      facility.sim
    )
      .flatMap((sector) =>
        facility.sim.queries.trading
          .get()
          .filter((f) => f.cp.position.sector === sector.id)
      )
      .filter(
        (f) =>
          (f.cp.owner.id === faction.id ||
            faction.cp.relations.values[f.cp.owner.id] >
              relationThresholds.trade) &&
          f.components.trade.offers[commodity].active &&
          f.components.trade.offers[commodity].type !==
            facility.components.trade.offers[commodity].type &&
          f.components.trade.offers[commodity].quantity >= minQuantity
      )
      .map((f) => ({
        facility: f,
        profit: profit(f),
      })),
    "profit"
  ).reverse();

  if (!sortedByProfit[0] || sortedByProfit[0].profit <= 0) {
    return null;
  }

  return minBy(
    sortedByProfit
      .filter(
        (f, _, arr) =>
          !Number.isFinite(f.profit) || f.profit / arr[0].profit >= 0.95
      )
      .map((f) => f.facility),
    distance
  )!;
}

export function getMineableAsteroid(
  field: AsteroidField
): Asteroid | undefined {
  return pickRandom(
    field.components.children.entities
      .map((e) => asteroid(field.sim.getOrThrow(e)!))
      .filter(
        (a) =>
          !a.components.minable.minedById && a.components.minable.resources > 0
      )
  );
}

/**
 *
 * Minimum required money to fulfill all buy requests, not taking
 * into account sell and inactive offers
 */
export function getPlannedBudget(entity: WithTrade): number {
  return commoditiesArray.reduce(
    (budget, commodity) =>
      budget +
      (entity.components.trade.offers[commodity].type === "sell" ||
      !entity.components.trade.offers[commodity].active
        ? 0
        : entity.cp.storage.quota[commodity] -
          entity.cp.storage.stored[commodity]) *
        entity.components.trade.offers[commodity].price,
    0
  );
}

/**
 * Calculates price of commodity given its production capabilities
 */
export function getCommodityCost(
  commodity: Commodity,
  facilityModules: FacilityModuleInput[],
  fn: (_it: Iterable<number>) => number = average
): number {
  const productionModules = facilityModules.filter(
    discriminate("type", "production")
  );

  if (!productionModules.find((fm) => fm.pac[commodity]?.produces)) {
    const x3 = (v: number) => [v, v * 3];
    return fn(
      {
        ice: x3(9),
        ore: x3(14),
        silica: x3(17),
        fuelium: x3(25),
        goldOre: x3(32),
      }[commodity]
    );
  }

  return pipe(
    productionModules,
    filter((fm) => fm.pac[commodity]?.produces),
    map((fm) =>
      pipe(
        Object.entries(fm.pac),
        filter(([_, pac]) => pac?.consumes),
        map(
          ([consumedCommodity, { consumes }]) =>
            (getCommodityCost(
              consumedCommodity as Commodity,
              productionModules,
              fn
            ) *
              consumes *
              1.2) /
            fm.pac[commodity]!.produces
        ),
        fxtsSum
      )
    ),
    fn,
    Math.floor
  );
}
