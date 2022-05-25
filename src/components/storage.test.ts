import { perCommodity } from "../utils/perCommodity";
import {
  addStorage,
  createCommodityStorage,
  getAvailableSpace,
  validateStorageAllocation,
} from "./storage";
import { newAllocation } from "./utils/allocations";

describe("Storage", () => {
  it("properly calculates available space when allocations were made", () => {
    const storage = createCommodityStorage();
    storage.max = 100;
    addStorage(storage, "food", 10);
    newAllocation(
      storage,
      {
        amount: { ...perCommodity(() => 0), food: 5 },
        type: "incoming",
      },
      (a) => validateStorageAllocation(storage, a)
    );
    newAllocation(
      storage,
      {
        amount: { ...perCommodity(() => 0), fuel: 5 },
        type: "incoming",
      },
      (a) => validateStorageAllocation(storage, a)
    );
    newAllocation(
      storage,
      {
        amount: { ...perCommodity(() => 0), food: 9 },
        type: "outgoing",
      },
      (a) => validateStorageAllocation(storage, a)
    );

    const stored = storage.availableWares;

    expect(stored.food).toBe(1);
    expect(stored.fuel).toBe(0);
    expect(getAvailableSpace(storage)).toBe(80);
  });

  it("properly validates new outgoing allocations", () => {
    const storage = createCommodityStorage();
    storage.max = 100;
    addStorage(storage, "food", 10);

    const allocation = newAllocation(
      storage,
      {
        amount: {
          ...perCommodity(() => 0),
          food: 10,
        },
        type: "outgoing",
      },
      (a) => validateStorageAllocation(storage, a)
    );

    expect(allocation).not.toBeNull();
    expect(getAvailableSpace(storage)).toBe(90);
  });

  it("properly validates new incoming allocations", () => {
    const storage = createCommodityStorage();
    storage.max = 100;
    addStorage(storage, "food", 10);

    const allocation = newAllocation(
      storage,
      {
        amount: {
          ...perCommodity(() => 0),
          food: 10,
        },
        type: "incoming",
      },
      (a) => validateStorageAllocation(storage, a)
    );

    expect(allocation).not.toBeNull();
    expect(getAvailableSpace(storage)).toBe(80);
  });
});
