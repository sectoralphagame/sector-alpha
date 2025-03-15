import { Vec2 } from "ogl";
import type { Facility } from "../archetypes/facility";
import { createFaction, factionComponents } from "../archetypes/faction";
import { createSector } from "../archetypes/sector";
import { changeBudgetMoney } from "../components/budget";
import { addStorage } from "../components/storage";
import { commodities } from "../economy/commodity";
import { Sim } from "../sim";
import { createFarm } from "../world/facilities";
import { settleStorageQuota } from "./storageQuotaPlanning";
import { TradingSystem } from "./trading";

describe("Trading system", () => {
  let sim: Sim;
  let system: TradingSystem;
  let facility: Facility;

  beforeEach(() => {
    system = new TradingSystem();
    sim = new Sim({
      systems: [system],
    });
    facility = createFarm(
      {
        owner: createFaction("F", sim)
          .addComponent({
            name: "ai",
            priceModifier: 0.01,
            stockpiling: 1,
            type: "territorial",
            home: 0,
            patrols: { formation: { fighters: 0 }, perSector: 0 },
            restrictions: { mining: false },
          })
          .requireComponents(factionComponents),
        position: new Vec2(0, 0),
        sector: createSector(sim, {
          name: "",
          position: [0, 0, 0],
          slug: "sector",
        }),
      },
      sim
    );
    facility.cp.storage.quota.food = 1000;
  });

  it("creates offers", () => {
    system.exec();

    expect(Object.keys(facility.cp.trade.offers)).toHaveLength(
      Object.keys(commodities).length
    );
    expect(facility.cp.trade.offers.food.quantity).toBeDefined();
  });

  it("creates sell offers is surplus is positive", () => {
    system.exec();

    expect(facility.cp.trade.offers.food.quantity).toBeGreaterThan(0);
  });

  it("creates buy offers is surplus is negative", () => {
    changeBudgetMoney(facility.cp.budget, 1000);
    system.exec();

    expect(facility.cp.trade.offers.water.type).toBe("buy");
  });

  it("properly sets offer quantity if has no commodity", () => {
    settleStorageQuota(facility);
    system.exec();

    expect(facility.cp.storage.quota.water).toBe(691);
    expect(facility.cp.trade.offers.water.quantity).toBe(691);
  });

  it("properly sets offer quantity if already has some commodity", () => {
    addStorage(facility.cp.storage, "water", 10, false);
    settleStorageQuota(facility);
    system.exec();

    expect(facility.cp.storage.quota.water).toBe(691);
    expect(facility.cp.trade.offers.water.quantity).toBe(681);
  });
});
