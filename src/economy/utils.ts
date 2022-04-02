import { Matrix, norm, subtract } from "mathjs";
import sortBy from "lodash/sortBy";
import { Facility } from "./factility";
import { Faction } from "./faction";
import { sim } from "../sim";

export function getClosestFacility(
  facilities: Facility[],
  position: Matrix
): Facility | null {
  const sortedByDistance = sortBy(
    facilities.map((facility) => ({
      facility,
      distance: norm(subtract(position, facility.position) as Matrix),
    })),
    "distance"
  );

  if (sortedByDistance[0]) {
    return sortedByDistance[0].facility;
  }

  return null;
}

export function getAnyClosestFacility(
  facility: Facility,
  // eslint-disable-next-line no-unused-vars
  filter: (value: Facility, index: number, array: Facility[]) => boolean
): Facility | null {
  let target = getClosestFacility(
    facility.owner.facilities.filter(filter),
    facility.position
  );
  if (!target) {
    target = getClosestFacility(
      sim.factions
        .filter((faction) => faction.slug !== facility.owner.slug)
        .map((faction) => faction.facilities)
        .flat()
        .filter(filter),
      facility.position
    );
  }

  return target;
}
