import { Matrix, norm, subtract, sum } from "mathjs";
import sortBy from "lodash/sortBy";
import uniqBy from "lodash/uniqBy";
import minBy from "lodash/minBy";
import { map } from "lodash";
import { Sim } from "../sim";
import { Commodity } from "./commodity";
import { RequireComponent } from "../tsHelpers";
import { AsteroidField } from "../archetypes/asteroidField";
import { asteroid, Asteroid } from "../archetypes/asteroid";
import { Sector } from "../archetypes/sector";

export type WithTrade = RequireComponent<
  "trade" | "storage" | "budget" | "position" | "owner"
>;

export function getSectorsInTeleportRange(
  origin: Sector,
  jumps: number,
  sim: Sim
): Sector[] {
  if (jumps === 0) {
    return [origin];
  }

  return uniqBy(
    [
      origin,
      ...sim.queries.teleports
        .get()
        .filter(
          (teleport) =>
            teleport.cp.parent!.value.requireComponents(["position"]).cp
              .position.sector === origin
        )
        .map((teleport) =>
          getSectorsInTeleportRange(
            teleport.cp.teleport.destination
              .requireComponents(["parent"])
              .cp.parent.value.requireComponents(["position"]).cp.position
              .sector,
            jumps - 1,
            sim
          )
        )
        .flat(),
    ],
    "id"
  );
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
    facility.components.owner.value === f.components.owner.value
      ? 1e20
      : (facility.components.trade.offers[commodity].price -
          f.components.trade.offers[commodity].price) *
        (facility.components.trade.offers[commodity].type === "buy" ? 1 : -1);

  const sortedByProfit = sortBy(
    (
      getSectorsInTeleportRange(
        facility.cp.position.sector,
        sectorDistance,
        facility.sim
      )
        .map((sector) =>
          facility.sim.queries.trading
            .get()
            .filter((f) => f.cp.position.sector === sector)
        )
        .flat()
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
    field.components.children.value
      .map(asteroid)
      .filter((a) => !a.components.minable.minedBy),
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
    map(entity.components.trade.offers).map(
      (offer) => (offer.type === "sell" ? 0 : offer.quantity) * offer.price
    )
  );
}
