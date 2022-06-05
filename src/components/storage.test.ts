import { perCommodity } from "../utils/perCommodity";
import {
  addStorage,
  createCommodityStorage,
  getAvailableSpace,
  newStorageAllocation,
} from "./storage";

describe("Storage", () => {
  it("properly calculates available space when allocations were made", () => {
    const storage = createCommodityStorage();
    storage.max = 100;
    addStorage(storage, "food", 10);
    newStorageAllocation(storage, {
      amount: { ...perCommodity(() => 0), food: 5 },
      type: "incoming",
    });
    newStorageAllocation(storage, {
      amount: { ...perCommodity(() => 0), fuel: 5 },
      type: "incoming",
    });
    newStorageAllocation(storage, {
      amount: { ...perCommodity(() => 0), food: 9 },
      type: "outgoing",
    });

    const stored = storage.availableWares;

    expect(stored.food).toBe(1);
    expect(stored.fuel).toBe(0);
    expect(getAvailableSpace(storage)).toBe(80);
  });

  it("properly validates new outgoing allocations", () => {
    const storage = createCommodityStorage();
    storage.max = 100;
    addStorage(storage, "food", 10);

    const allocation = newStorageAllocation(storage, {
      amount: {
        ...perCommodity(() => 0),
        food: 10,
      },
      type: "outgoing",
    });

    expect(allocation).not.toBeNull();
    expect(getAvailableSpace(storage)).toBe(90);
  });

  it("properly validates new incoming allocations", () => {
    const storage = createCommodityStorage();
    storage.max = 100;
    addStorage(storage, "food", 10);

    const allocation = newStorageAllocation(storage, {
      amount: {
        ...perCommodity(() => 0),
        food: 10,
      },
      type: "incoming",
    });

    expect(allocation).not.toBeNull();
    expect(getAvailableSpace(storage)).toBe(80);
  });
});
