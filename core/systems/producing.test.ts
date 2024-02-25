import { createProduction } from "../components/production";
import type { CommodityStorage } from "../components/storage";
import { addStorage, createCommodityStorage } from "../components/storage";
import { ProducingSystem } from "./producing";

describe("ProducingSystem", () => {
  const production = createProduction({
    water: { consumes: 1000, produces: 0 },
    food: { consumes: 0, produces: 1000 },
  });
  let storage: CommodityStorage;

  beforeEach(() => {
    storage = createCommodityStorage(1000);
    storage.quota.water = 500;
    storage.quota.food = 500;
  });

  test("correctly produces commodities", () => {
    addStorage(storage, "water", 100);
    ProducingSystem.produce(production, storage, [1]);

    expect(storage.stored.water).toEqual(67);
    expect(storage.stored.food).toEqual(33);
  });

  test("correctly takes bonuses into account", () => {
    addStorage(storage, "water", 100);
    ProducingSystem.produce(production, storage, [2]);

    expect(storage.stored.water).toEqual(67);
    expect(storage.stored.food).toEqual(66);
  });
});
