import { Matrix, norm, subtract } from "mathjs";
import sortBy from "lodash/sortBy";
import { Facility, TradeOffer } from "./factility";

export function isSellOffer(offer: TradeOffer): boolean {
  return offer.quantity > 0;
}

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
