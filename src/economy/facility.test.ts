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
});
