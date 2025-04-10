import { commodities, type Commodity } from "../economy/commodity";

export function perCommodity<T, TCommodities extends Commodity[]>(
  // eslint-disable-next-line no-unused-vars
  cb: (commodity: TCommodities[number]) => T,
  subset?: TCommodities
): Record<TCommodities[number], T> {
  const ret = {} as Record<TCommodities[number], T>;

  for (const commodity of subset ?? commodities) {
    ret[commodity] = cb(commodity);
  }

  return ret;
}
