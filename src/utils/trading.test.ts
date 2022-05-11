import { matrix } from "mathjs";
import { Facility } from "../archetypes/facility";
import { Faction } from "../economy/faction";
import { Sim } from "../sim";
import { settleStorageQuota } from "../systems/storageQuotaPlanning";
import { createOffers } from "../systems/trading";
import { createFarm } from "../world/facilities";
import { getNeededCommodities } from "./trading";

describe("Trading module", () => {
  let sim: Sim;
  let facility: Facility;

  beforeEach(() => {
    sim = new Sim();
    facility = createFarm(
      { position: matrix([0, 0]), owner: new Faction("0") },
      sim
    );
    facility.cp.budget.changeMoney(100);
  });

  it("properly sorts by most needed commodity 1", () => {
    settleStorageQuota(facility);
    createOffers(facility);

    expect(getNeededCommodities(facility)).toEqual(["water", "fuel"]);
  });

  it("properly sorts by most needed commodity 2", () => {
    facility.cp.storage.removeStorage("food", 50);
    facility.cp.storage.addStorage("water", 10);
    settleStorageQuota(facility);
    createOffers(facility);

    expect(facility.cp.trade.offers.food.quantity).not.toBeGreaterThan(0);
    expect(facility.cp.trade.offers.fuel.type).toBe("buy");
    expect(facility.cp.trade.offers.water.type).toBe("buy");
    expect(getNeededCommodities(facility)).toEqual(["water", "fuel"]);
  });
});
