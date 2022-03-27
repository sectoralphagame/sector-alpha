import { Matrix, norm, subtract } from "mathjs";
import sortBy from "lodash/sortBy";
import { Facility } from "./factility";

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
