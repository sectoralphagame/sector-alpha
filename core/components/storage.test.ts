import { perCommodity } from "../utils/perCommodity";
import type { CommodityStorage } from "./storage";
import {
  addStorage,
  createCommodityStorage,
  getAvailableSpace,
  newStorageAllocation,
  removeStorage,
} from "./storage";

describe("Storage", () => {
  let storage: CommodityStorage;

  beforeEach(() => {
    storage = createCommodityStorage();
    storage.max = 100;
  });

  it("properly adds commodities to storage", () => {
    expect(storage.stored.food).toBe(0);

    addStorage(storage, "food", 10);

    expect(storage.stored.food).toBe(10);
    expect(storage.availableWares.food).toBe(10);
  });

  it("properly throws when adding too much commodities while in exact mode", () => {
    expect(() => addStorage(storage, "food", 200, true)).toThrow();
  });

  it("properly adds commodities when adding too much while not in exact mode", () => {
    addStorage(storage, "food", 200, false);
    expect(storage.stored.food).toBe(100);
  });

  it("properly removes commodities from storage", () => {
    addStorage(storage, "food", 10);
    expect(storage.stored.food).toBe(10);

    removeStorage(storage, "food", 5);

    expect(storage.stored.food).toBe(5);
    expect(storage.availableWares.food).toBe(5);
  });

  it("properly calculates available space when allocations were made", () => {
    addStorage(storage, "food", 10);
    newStorageAllocation(storage, {
      amount: { ...perCommodity(() => 0), food: 5 },
      type: "incoming",
      issued: 0,
    });
    newStorageAllocation(storage, {
      amount: { ...perCommodity(() => 0), fuel: 5 },
      type: "incoming",
      issued: 0,
    });
    newStorageAllocation(storage, {
      amount: { ...perCommodity(() => 0), food: 9 },
      type: "outgoing",
      issued: 0,
    });

    const stored = storage.availableWares;

    expect(stored.food).toBe(1);
    expect(stored.fuel).toBe(0);
    expect(getAvailableSpace(storage)).toBe(80);
  });

  it("properly validates new outgoing allocations", () => {
    addStorage(storage, "food", 10);

    const allocation = newStorageAllocation(storage, {
      amount: {
        ...perCommodity(() => 0),
        food: 10,
      },
      type: "outgoing",
      issued: 0,
    });

    expect(allocation).not.toBeNull();
    expect(getAvailableSpace(storage)).toBe(90);
  });

  it("properly validates new incoming allocations", () => {
    addStorage(storage, "food", 10);

    const allocation = newStorageAllocation(storage, {
      amount: {
        ...perCommodity(() => 0),
        food: 10,
      },
      type: "incoming",
      issued: 0,
    });

    expect(allocation).not.toBeNull();
    expect(getAvailableSpace(storage)).toBe(80);
  });
});
