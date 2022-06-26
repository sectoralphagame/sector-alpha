import { Matrix, norm, subtract, sum } from "mathjs";
import sortBy from "lodash/sortBy";
import minBy from "lodash/minBy";
import maxBy from "lodash/maxBy";
import groupBy from "lodash/groupBy";
import { Sim } from "../sim";
import { Commodity, MineableCommodity } from "./commodity";
import { RequireComponent } from "../tsHelpers";
import { AsteroidField } from "../archetypes/asteroidField";
import { asteroid, Asteroid } from "../archetypes/asteroid";
import { Sector, sector as asSector } from "../archetypes/sector";
import { Marker } from "../archetypes/marker";
import { perCommodity } from "../utils/perCommodity";

const tradeComponents = [
  "trade",
  "storage",
  "budget",
  "position",
  "owner",
  "docks",
] as const;
export type WithTrade = RequireComponent<typeof tradeComponents[number]>;

export function getSectorsInTeleportRange(
  origin: Sector,
  jumps: number,
  sim: Sim
): Sector[] {
  const ids = Object.entries(sim.paths[origin.id.toString()])
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
  from: Marker,
  sectorDistance: number
): TradeWithMostProfit | null {
  const facilitiesInRange = getSectorsInTeleportRange(
    asSector(from.sim.getOrThrow(from.cp.position.sector)!),
    sectorDistance,
    from.sim
  ).flatMap((sector) =>
    from.sim.queries.trading
      .get()
      .filter((f) => f.cp.position.sector === sector.id)
  );

  const bestOffers = perCommodity((commodity) => ({
    // We buy, facility sells
    buy: minBy(
      facilitiesInRange.filter(
        (f) =>
          f.cp.trade.offers[commodity].type === "sell" &&
          f.cp.trade.offers[commodity].quantity > 0
      ),
      (f) => f.cp.trade.offers[commodity].price
    ),
    sell: maxBy(
      facilitiesInRange.filter(
        (f) =>
          f.cp.trade.offers[commodity].type === "buy" &&
          f.cp.trade.offers[commodity].quantity > 0
      ),
      (f) => f.cp.trade.offers[commodity].price
    ),
  }));

  const profits = Object.entries(
    perCommodity((commodity) =>
      bestOffers[commodity].sell && bestOffers[commodity].buy
        ? bestOffers[commodity].sell!.cp.trade.offers[commodity].price /
          bestOffers[commodity].buy!.cp.trade.offers[commodity].price
        : 0
    )
  )
    .map(([commodity, profit]) => ({
      commodity,
      profit,
    }))
    .filter(({ profit }) => profit > 1);

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

  const profit = (f: WithTrade) =>
    facility.components.owner.id === f.components.owner.id
      ? 1e20
      : (facility.components.trade.offers[commodity].price -
          f.components.trade.offers[commodity].price) *
        (facility.components.trade.offers[commodity].type === "buy" ? 1 : -1);

  const sortedByProfit = sortBy(
    (
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
            f.components.trade.offers[commodity].type !==
              facility.components.trade.offers[commodity].type &&
            f.components.trade.offers[commodity].quantity >= minQuantity
        ) as WithTrade[]
    ).map((f) => ({
      facility: f,
      profit: profit(f),
    })),
    "profit"
  ).reverse();

  if (!sortedByProfit[0] || sortedByProfit[0].profit <= 0) {
    return null;
  }

  return sortBy(
    sortedByProfit
      .filter((f, _, arr) => f.profit / arr[0].profit >= 0.95)
      .map((f) => f.facility),
    distance
  ).reverse()[0];
}

export function getClosestMineableAsteroid(
  field: AsteroidField,
  position: Matrix
): Asteroid | undefined {
  return minBy(
    field.components.children.entities
      .map((e) => asteroid(field.sim.getOrThrow(e)!))
      .filter(
        (a) =>
          !a.components.minable.minedById && a.components.minable.resources > 0
      ),
    (r) => norm(subtract(position, asteroid(r).cp.position.coord) as Matrix)
  );
}

/**
 *
 * @returns Minimum required money to fulfill all buy requests, not taking
 * into account sell offers
 */
export function getPlannedBudget(entity: WithTrade): number {
  return sum(
    Object.entries(entity.components.trade.offers).map(
      ([commodity, offer]) =>
        (offer.type === "sell"
          ? 0
          : entity.cp.storage.quota[commodity] -
            entity.cp.storage.stored[commodity]) * offer.price
    )
  );
}

export function getSectorResources(
  sector: Sector
): Record<MineableCommodity, number> {
  const fields = sector.sim.queries.asteroidFields
    .get()
    .filter((field) => field.cp.position.sector === sector.id);
  const fieldsByType = groupBy(fields, (field) => field.cp.asteroidSpawn.type);

  return perCommodity((commodity) =>
    fieldsByType[commodity]
      ?.map((field) => field.cp.children.entities)
      .flat()
      .reduce(
        (acc, a) =>
          acc +
          sector.sim.getOrThrow(a).requireComponents(["minable"]).cp.minable
            .resources,
        0
      )
  );
}
