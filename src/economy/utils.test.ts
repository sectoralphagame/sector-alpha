import { facilityModules } from "./facilityModule";
import { Facility } from "./factility";
import { createIsAbleToProduce } from "./utils";

describe("createIsAbleToProduce", () => {
  let facility: Facility;
  beforeEach(() => {
    facility = new Facility();
    facility.addModule(facilityModules.containerSmall);
    facility.addModule(facilityModules.farm);
  });

  it("properly returns true if got everything needed for production", () => {
    facility.storage.addStorage("fuel", 20);
    facility.storage.addStorage("water", 20);

    const isAbleToProduce = createIsAbleToProduce(facility);

    expect(isAbleToProduce(facility.modules[1])).toBe(true);
  });

  it("properly returns false if met partially requirements for production", () => {
    facility.storage.addStorage("fuel", 20);

    const isAbleToProduce = createIsAbleToProduce(facility);

    expect(isAbleToProduce(facility.modules[1])).toBe(false);
  });

  it("properly returns false if requirements for production are not met at all", () => {
    const isAbleToProduce = createIsAbleToProduce(facility);

    expect(isAbleToProduce(facility.modules[1])).toBe(false);
  });
});
