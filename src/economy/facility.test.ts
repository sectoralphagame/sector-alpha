import { perCommodity } from "../utils/perCommodity";
import { commodities } from "./commodity";
import { facilityModules } from "./facilityModule";
import { Facility } from "./factility";

describe("Facility", () => {
  it("creates offers after creation", () => {
    const facility = new Facility();

    expect(Object.keys(facility.offers)).toHaveLength(
      Object.keys(commodities).length
    );
    expect(facility.offers.food.quantity).toBeDefined();
  });

  it("recreates offers after module change", () => {
    const facility = new Facility();
    facility.addModule(facilityModules.containerSmall);
    facility.storage.addStorage("food", 10, false);
    facility.addModule(facilityModules.farm);

    expect(facility.offers.food.quantity).not.toBe(0);
  });

  it("recreates offers after storage change", () => {
    const facility = new Facility();
    facility.addModule(facilityModules.containerSmall);
    facility.addModule(facilityModules.farm);
    facility.storage.addStorage("food", 10, false);
    const prevOffer = facility.offers.food.quantity;

    facility.storage.addStorage("food", 10, false);

    expect(facility.offers.food.quantity).not.toBe(prevOffer);
  });

  it("creates sell offers is surplus is positive", () => {
    const facility = new Facility();
    facility.addModule(facilityModules.containerSmall);
    facility.addModule(facilityModules.farm);
    facility.storage.addStorage("food", 10, false);

    expect(facility.offers.food.quantity).toBeGreaterThan(0);
  });

  it("creates buy offers is surplus is negative", () => {
    const facility = new Facility();
    facility.budget.changeMoney(1000);
    facility.addModule(facilityModules.containerSmall);
    facility.addModule(facilityModules.farm);
    facility.storage.addStorage("food", 10, false);

    expect(facility.offers.water.type).toBe("buy");
  });

  it("properly sorts by most needed commodity 1", () => {
    const facility = new Facility();
    facility.addModule(facilityModules.containerSmall);
    facility.addModule(facilityModules.farm);

    expect(facility.getNeededCommodities()).toEqual(["water", "fuel"]);
  });

  it("properly sorts by most needed commodity 2", () => {
    const facility = new Facility();
    facility.budget.changeMoney(100);
    facility.addModule(facilityModules.containerSmall);
    facility.addModule(facilityModules.farm);
    facility.storage.addStorage("water", 10, false);

    expect(facility.offers.food.quantity).not.toBeGreaterThan(0);
    expect(facility.offers.fuel.type).toBe("buy");
    expect(facility.offers.water.type).toBe("buy");
    expect(facility.getNeededCommodities()).toEqual(["fuel", "water"]);
  });

  it("lowers prices if sales are dropping", () => {
    const facility = new Facility();
    facility.budget.changeMoney(100);
    facility.addModule(facilityModules.containerSmall);
    facility.addModule(facilityModules.farm);
    facility.storage.addStorage("food", 10, false);
    facility.lastPriceAdjust = {
      time: 0,
      commodities: perCommodity((commodity) => (commodity === "food" ? 10 : 0)),
    };
    const previousPrice = facility.offers.food.price;

    facility.adjustPrices();

    expect(facility.offers.food.price).toBeLessThan(previousPrice);
  });

  it("rises prices if sales are rising", () => {
    const facility = new Facility();
    facility.budget.changeMoney(100);
    facility.addModule(facilityModules.containerSmall);
    facility.addModule(facilityModules.farm);
    facility.storage.addStorage("food", 10, false);
    facility.lastPriceAdjust = {
      time: 0,
      commodities: perCommodity((commodity) => (commodity === "food" ? 10 : 0)),
    };
    const previousPrice = facility.offers.food.price;

    facility.transactions.push({
      commodity: "food",
      price: 100,
      quantity: 20,
      time: 1,
      type: "buy",
    });
    facility.adjustPrices();

    expect(facility.offers.food.price).toBeGreaterThan(previousPrice);
  });

  it("rises offer prices if supplies are dropping", () => {
    const facility = new Facility();
    facility.budget.changeMoney(100);
    facility.addModule(facilityModules.containerSmall);
    facility.addModule(facilityModules.farm);
    facility.storage.addStorage("water", 10, false);
    facility.lastPriceAdjust = {
      time: 0,
      commodities: perCommodity((commodity) =>
        commodity === "water" ? 10 : 0
      ),
    };
    const previousPrice = facility.offers.water.price;

    facility.adjustPrices();

    expect(facility.offers.water.price).toBeGreaterThan(previousPrice);
  });

  it("lowers offer prices if supplies are rising", () => {
    const facility = new Facility();
    facility.budget.changeMoney(100);
    facility.addModule(facilityModules.containerSmall);
    facility.addModule(facilityModules.farm);
    facility.storage.addStorage("water", 10, false);
    facility.lastPriceAdjust = {
      time: 0,
      commodities: perCommodity((commodity) =>
        commodity === "water" ? 10 : 0
      ),
    };
    const previousPrice = facility.offers.water.price;

    facility.transactions.push({
      commodity: "water",
      price: 100,
      quantity: 20,
      time: 1,
      type: "sell",
    });
    facility.adjustPrices();

    expect(facility.offers.water.price).toBeLessThan(previousPrice);
  });
});
