import { commodities, Commodity } from "../economy/commodity";

export function perCommodity<T>(
  // eslint-disable-next-line no-unused-vars
  cb: (commodity: Commodity) => T
): Record<Commodity, T> {
  return Object.values(commodities)
    .map((commodity) => ({
      commodity,
      data: cb(commodity),
    }))
    .reduce(
      (acc, v) => ({ ...acc, [v.commodity]: v.data }),
      {} as Record<Commodity, T>
    );
}
