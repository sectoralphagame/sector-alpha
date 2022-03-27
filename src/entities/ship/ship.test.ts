import { matrix } from "mathjs";
import { Ship, tradeOrder } from ".";
import { Facility } from "../../economy/factility";
import { Faction } from "../../economy/faction";
import { shipClasses } from "../../world/ships";

describe("Ship", () => {
  it("is able to go to target position", () => {
    const ship = new Ship(shipClasses.shipA);
    ship.position = matrix([1, 0]);

    const reached = ship.moveTo(1, matrix([1, 0.5]));

    expect(reached).toBe(true);
  });

  it("is not able to go to target position if travel is too short", () => {
    const ship = new Ship(shipClasses.shipA);
    ship.position = matrix([1, 0]);

    const reached = ship.moveTo(1, matrix([1, 10]));

    expect(reached).toBe(false);
  });

  it("is able to make move order", () => {
    const ship = new Ship(shipClasses.shipA);
    ship.position = matrix([1, 0]);

    ship.moveOrder(1, {
      type: "move",
      position: matrix([1, 0.5]),
    });

    expect(ship.position.get([0])).toBe(1);
    expect(ship.position.get([1])).toBe(0.5);
  });

  it("is able to sell", () => {
    const facility = new Facility();
    facility.storage.max = 100;
    facility.offers.food = { price: 1, quantity: -20 };
    facility.position = matrix([1, 0]);
    facility.budget.changeMoney(20);

    const ship = new Ship(shipClasses.shipA);
    ship.storage.addStorage("food", 10);
    ship.position = matrix([1, 0]);

    const traded = ship.tradeOrder(
      1,
      tradeOrder({
        offer: {
          commodity: "food",
          faction: facility.owner,
          price: 1,
          quantity: 10,
          budget: facility.budget,
          allocation: null,
        },
        target: facility,
      })
    );

    expect(traded).toBe(true);
    expect(facility.storage.stored.food).toBe(10);
    expect(ship.storage.stored.food).toBe(0);
  });

  it("is able to buy", () => {
    const facilityFaction = new Faction("facility-faction");
    const facility = new Facility();
    facilityFaction.addFacility(facility);
    facility.storage.max = 100;
    facility.offers.food = { price: 1, quantity: 20 };
    facility.addStorage("food", 20, { recreateOffers: true, exact: false });
    facility.position = matrix([1, 0]);

    const shipFaction = new Faction("ship-faction");
    shipFaction.budget.changeMoney(100);
    const ship = new Ship(shipClasses.shipA);
    ship.setOwner(shipFaction);
    ship.position = matrix([1, 0]);

    const traded = ship.tradeOrder(
      1,
      tradeOrder({
        offer: {
          commodity: "food",
          faction: facility.owner,
          price: 1,
          quantity: -10,
          budget: shipFaction.budget,
          allocation: null,
        },
        target: facility,
      })
    );

    expect(traded).toBe(true);
    expect(facility.storage.stored.food).toBe(10);
    expect(ship.storage.stored.food).toBe(10);
  });

  it("is able to buy from own faction", () => {
    const faction = new Faction("faction");
    const facility = new Facility();
    faction.addFacility(facility);
    facility.storage.max = 100;
    facility.offers.food = { price: 1, quantity: 20 };
    facility.addStorage("food", 20, { recreateOffers: true, exact: false });
    facility.position = matrix([1, 0]);

    const ship = new Ship(shipClasses.shipA);
    ship.setOwner(faction);
    ship.position = matrix([1, 0]);

    const traded = ship.tradeOrder(
      1,
      tradeOrder({
        offer: {
          commodity: "food",
          faction: facility.owner,
          price: 0,
          quantity: -10,
          budget: faction.budget,
          allocation: null,
        },
        target: facility,
      })
    );

    expect(traded).toBe(true);
    expect(facility.storage.stored.food).toBe(10);
    expect(ship.storage.stored.food).toBe(10);
  });
});
