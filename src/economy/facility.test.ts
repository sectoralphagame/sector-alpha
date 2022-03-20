import { commodities } from "./commodity";
import { facilityModules } from "./facilityModule";
import { Facility } from "./factility";

describe("Facility", () => {
  it("creates offers after creation", () => {
    const facility = new Facility();

    expect(Object.keys(facility.offers)).toHaveLength(
      Object.keys(commodities).length
    );
    expect(facility.offers.food.quantity).toBe(0);
  });

  it("recreates offers after module change", () => {
    const facility = new Facility();
    facility.addModule(facilityModules.containerSmall);
    facility.addStorage("food", 10);
    facility.addModule(facilityModules.farm);

    expect(facility.offers.food.quantity).not.toBe(0);
  });

  it("recreates offers after storage change", () => {
    const facility = new Facility();
    facility.addModule(facilityModules.containerSmall);
    facility.addModule(facilityModules.farm);
    facility.addStorage("food", 10);
    const prevOffer = facility.offers.food.quantity;

    facility.addStorage("food", 10);

    expect(facility.offers.food.quantity).not.toBe(prevOffer);
  });

  it("creates sell offers is surplus is positive", () => {
    const facility = new Facility();
    facility.addModule(facilityModules.containerSmall);
    facility.addModule(facilityModules.farm);
    facility.addStorage("food", 10);

    expect(facility.offers.food.quantity).toBeGreaterThan(0);
  });

  it("creates buy offers is surplus is negative", () => {
    const facility = new Facility();
    facility.addModule(facilityModules.containerSmall);
    facility.addModule(facilityModules.farm);
    facility.budget.changeMoney(1000);
    facility.addStorage("food", 10);

    expect(facility.offers.water.quantity).toBeLessThan(0);
  });

  it("properly sorts by most needed commodity 1", () => {
    const facility = new Facility();
    facility.addModule(facilityModules.containerSmall);
    facility.addModule(facilityModules.farm);

    expect(facility.getNeededCommodities()).toEqual(["water", "fuel"]);
  });

  it("properly sorts by most needed commodity 2", () => {
    const facility = new Facility();
    facility.addModule(facilityModules.containerSmall);
    facility.addModule(facilityModules.farm);
    facility.addStorage("water", 10);

    expect(facility.getNeededCommodities()).toEqual(["fuel", "water"]);
  });
});
