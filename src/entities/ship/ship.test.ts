import { matrix } from "mathjs";
import { Ship } from ".";
import { Budget } from "../../economy/budget";
import { Facility } from "../../economy/factility";
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

    const ship = new Ship(shipClasses.shipA);
    ship.storage.addStorage("food", 10);
    ship.position = matrix([1, 0]);

    const traded = ship.tradeOrder(1, {
      type: "trade",
      offer: {
        commodity: "food",
        faction: facility.faction,
        price: 1,
        quantity: 10,
        budget: new Budget(),
      },
      target: facility,
    });

    expect(traded).toBe(true);
    expect(facility.storage.stored.food).toBe(10);
    expect(ship.storage.stored.food).toBe(0);
  });

  it("is able to buy", () => {
    const facility = new Facility();
    facility.storage.max = 100;
    facility.offers.food = { price: 1, quantity: 20 };
    facility.storage.addStorage("food", 20);
    facility.position = matrix([1, 0]);

    const ship = new Ship(shipClasses.shipA);
    ship.position = matrix([1, 0]);

    const traded = ship.tradeOrder(1, {
      type: "trade",
      offer: {
        commodity: "food",
        faction: facility.faction,
        price: 1,
        quantity: -10,
        budget: new Budget(),
      },
      target: facility,
    });

    expect(traded).toBe(true);
    expect(facility.storage.stored.food).toBe(10);
    expect(ship.storage.stored.food).toBe(10);
  });
});
