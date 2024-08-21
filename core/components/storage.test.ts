import { Entity } from "../entity";
import { Sim } from "../sim";
import type { RequireComponent } from "../tsHelpers";
import { perCommodity } from "../utils/perCommodity";
import { createDrive } from "./drive";
import type { CommodityStorage } from "./storage";
import {
  addStorage,
  createCommodityStorage,
  getAvailableSpace,
  newStorageAllocation,
  removeStorage,
  transfer,
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
      issued: 0,
    });
    newStorageAllocation(storage, {
      amount: { ...perCommodity(() => 0), fuel: 5 },
      issued: 0,
    });
    newStorageAllocation(storage, {
      amount: { ...perCommodity(() => 0), food: -7 },
      issued: 0,
    });
    newStorageAllocation(storage, {
      amount: { ...perCommodity(() => 0), food: -2, fuel: 3 },
      issued: 0,
    });

    const available = storage.availableWares;

    expect(storage.allocations.length).toBe(4);
    expect(available.food).toBe(1);
    expect(available.fuel).toBe(0);
    expect(getAvailableSpace(storage)).toBe(79);
  });

  it("properly validates new outgoing allocations", () => {
    addStorage(storage, "food", 10);

    const allocation = newStorageAllocation(storage, {
      amount: {
        ...perCommodity(() => 0),
        food: -10,
      },
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
      issued: 0,
    });

    expect(allocation).not.toBeNull();
    expect(getAvailableSpace(storage)).toBe(80);
  });
});

describe("Transfer", () => {
  let sim: Sim;
  let source: RequireComponent<"storage">;
  let target: RequireComponent<"storage">;

  beforeEach(() => {
    sim = new Sim();
    source = new Entity(sim)
      .addComponent(createCommodityStorage(100))
      .addComponent(
        createDrive({
          acceleration: 0,
          cruise: 0,
          maneuver: 0,
          rotary: 0,
          ttc: 0,
        })
      )
      .requireComponents(["storage"]);
    target = new Entity(sim)
      .addComponent(createCommodityStorage(100))
      .requireComponents(["storage"]);
  });

  it("properly transferts commodities", () => {
    addStorage(source.cp.storage, "food", 10);
    const transferred = transfer(source, "food", 10, target, {
      exact: true,
      transfer: true,
    });

    expect(transferred).toBe(10);
    expect(source.cp.storage.stored.food).toBe(0);
    expect(target.cp.storage.stored.food).toBe(10);
    expect(source.cp.storageTransfer!.amount).toBe(10);
    expect(source.cp.storageTransfer!.transferred).toBe(0);
  });

  it("properly throws on insufficient stock", () => {
    expect(() =>
      transfer(source, "food", 10, target, {
        exact: true,
        transfer: true,
      })
    ).toThrow();
  });

  it("properly omits transfer component if false provided", () => {
    addStorage(source.cp.storage, "food", 10);
    const transferred = transfer(source, "food", 10, target, {
      exact: true,
      transfer: false,
    });

    expect(transferred).toBe(10);
    expect(source.cp.storage.stored.food).toBe(0);
    expect(target.cp.storage.stored.food).toBe(10);
    expect(source.cp.storageTransfer).not.toBeDefined();
  });
});
