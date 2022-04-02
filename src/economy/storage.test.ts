import { perCommodity } from "../utils/perCommodity";
import { CommodityStorage } from "./storage";

describe("Storage", () => {
  it("properly calculates available space when allocations were made", () => {
    const storage = new CommodityStorage();
    storage.max = 100;
    storage.addStorage("food", 10);
    storage.allocationManager.new({
      amount: { ...perCommodity(() => 0), food: 5 },
      type: "incoming",
    });
    storage.allocationManager.new({
      amount: { ...perCommodity(() => 0), fuel: 5 },
      type: "incoming",
    });
    storage.allocationManager.new({
      amount: { ...perCommodity(() => 0), food: 9 },
      type: "outgoing",
    });

    const stored = storage.getAvailableWares();

    expect(stored.food).toBe(1);
    expect(stored.fuel).toBe(0);
    expect(storage.getAvailableSpace()).toBe(80);
  });

  it("properly validates new outgoing allocations", () => {
    const storage = new CommodityStorage();
    storage.max = 100;
    storage.addStorage("food", 10);

    const allocation = storage.allocationManager.new({
      amount: {
        ...perCommodity(() => 0),
        food: 10,
      },
      type: "outgoing",
    });

    expect(allocation).not.toBeNull();
    expect(storage.getAvailableSpace()).toBe(90);
  });

  it("properly validates new incoming allocations", () => {
    const storage = new CommodityStorage();
    storage.max = 100;
    storage.addStorage("food", 10);

    const allocation = storage.allocationManager.new({
      amount: {
        ...perCommodity(() => 0),
        food: 10,
      },
      type: "incoming",
    });

    expect(allocation).not.toBeNull();
    expect(storage.getAvailableSpace()).toBe(80);
  });
});
