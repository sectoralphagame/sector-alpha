import { matrix } from "mathjs";
import { Facility } from "../archetypes/facility";
import { createFaction } from "../archetypes/faction";
import { createSector } from "../archetypes/sector";
import { changeBudgetMoney } from "../components/budget";
import { addStorage } from "../components/storage";
import { commodities } from "../economy/commodity";
import { Sim } from "../sim";
import { perCommodity } from "../utils/perCommodity";
import { createFarm } from "../world/facilities";
import { settleStorageQuota } from "./storageQuotaPlanning";
import { TradingSystem } from "./trading";

describe("Trading module", () => {
  let sim: Sim;
  let system: TradingSystem;
  let facility: Facility;

  beforeEach(() => {
    sim = new Sim();
    system = new TradingSystem(sim);
    facility = createFarm(
      {
        owner: createFaction("F", sim),
        position: matrix([0, 0]),
        sector: createSector(sim, { name: "", position: matrix([0, 0, 0]) }),
      },
      sim
    );
  });

  it("creates offers", () => {
    system.exec(10);

    expect(Object.keys(facility.cp.trade.offers)).toHaveLength(
      Object.keys(commodities).length
    );
    expect(facility.cp.trade.offers.food.quantity).toBeDefined();
  });

  it("creates sell offers is surplus is positive", () => {
    system.exec(10);

    expect(facility.cp.trade.offers.food.quantity).toBeGreaterThan(0);
  });

  it("creates buy offers is surplus is negative", () => {
    changeBudgetMoney(facility.cp.budget, 1000);
    system.exec(10);

    expect(facility.cp.trade.offers.water.type).toBe("buy");
  });

  it("lowers prices if sales are dropping", () => {
    changeBudgetMoney(facility.cp.budget, 1000);
    system.exec(10);
    facility.cp.trade.offers.food.price = 1000;
    facility.cp.trade.lastPriceAdjust = {
      time: 0,
      commodities: perCommodity((commodity) => (commodity === "food" ? 10 : 0)),
    };
    const previousPrice = facility.cp.trade.offers.food.price;

    system.exec(5000);

    expect(facility.cp.trade.offers.food.price).toBeLessThan(previousPrice);
  });

  it("rises prices if sales are rising", () => {
    changeBudgetMoney(facility.cp.budget, 1000);
    system.exec(10);
    facility.cp.trade.lastPriceAdjust = {
      time: 0,
      commodities: perCommodity((commodity) => (commodity === "food" ? 10 : 0)),
    };
    const previousPrice = facility.cp.trade.offers.food.price;

    facility.cp.trade.transactions.push({
      commodity: "food",
      price: 100,
      quantity: 20,
      time: 1,
      type: "buy",
    });
    system.exec(1000);

    expect(facility.cp.trade.offers.food.price).toBeGreaterThan(previousPrice);
  });

  it("rises offer prices if supplies are dropping", () => {
    changeBudgetMoney(facility.cp.budget, 1000);
    addStorage(facility.cp.storage, "water", 10, false);
    settleStorageQuota(facility);
    system.exec(10);
    facility.cp.trade.lastPriceAdjust = {
      time: 0,
      commodities: perCommodity((commodity) =>
        commodity === "water" ? 10 : 0
      ),
    };
    const previousPrice = facility.cp.trade.offers.water.price;

    system.exec(1000);

    expect(facility.cp.trade.offers.water.price).toBeGreaterThan(previousPrice);
  });

  it("lowers offer prices if supplies are rising", () => {
    changeBudgetMoney(facility.cp.budget, 1000);
    addStorage(facility.cp.storage, "water", 10, false);
    settleStorageQuota(facility);
    system.exec(10);
    facility.cp.trade.lastPriceAdjust = {
      time: 0,
      commodities: perCommodity((commodity) =>
        commodity === "water" ? 10 : 0
      ),
    };
    const previousPrice = facility.cp.trade.offers.water.price;

    facility.cp.trade.transactions.push({
      commodity: "water",
      price: 100,
      quantity: 20,
      time: 1,
      type: "sell",
    });
    system.exec(1000);

    expect(facility.cp.trade.offers.water.price).toBeLessThan(previousPrice);
  });
});
