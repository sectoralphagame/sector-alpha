import { matrix } from "mathjs";
import { createFacility, facilityComponents } from "../../archetypes/facility";
import { createFaction } from "../../archetypes/faction";
import { createSector } from "../../archetypes/sector";
import { createShip } from "../../archetypes/ship";
import { changeBudgetMoney } from "../../components/budget";
import { addStorage } from "../../components/storage";
import type { TransactionInput } from "../../components/trade";
import { Sim } from "../../sim";
import { tradeCommodity } from "../../utils/trading";
import { shipClasses } from "../../world/ships";
import { PathPlanningSystem } from "../pathPlanning";
import { removeOrder } from "./orderExecuting";

describe("Trade action cleanup", () => {
  let sim: Sim;
  const commodity = "food";
  const quantity = 10;

  beforeEach(() => {
    sim = new Sim();
    const pathPlanning = new PathPlanningSystem(sim);
    pathPlanning.exec(0);
  });

  it("should work for sell orders", () => {
    const faction = createFaction("Faction", sim);
    const sector = createSector(sim, {
      position: matrix([0, 0]),
      name: "Sector",
    });
    const ship = createShip(sim, {
      ...shipClasses.find((sc) => sc.slug === "courierA")!,
      position: matrix([0, 0]),
      owner: faction,
      sector,
    });
    addStorage(ship.cp.storage, commodity, quantity);

    const facility = createFacility(sim, {
      owner: faction,
      position: matrix([0, 0]),
      sector,
    });
    facility.cp.storage.max = 1000;
    facility.cp.trade.offers[commodity] = {
      active: true,
      price: 10,
      quantity: 100,
      type: "buy",
    };
    changeBudgetMoney(facility.cp.budget, 10000);

    const offer: TransactionInput = {
      budget: faction.id,
      commodity,
      factionId: faction.id,
      initiator: ship.id,
      price: 10,
      quantity,
      type: "sell",
      allocations: null,
    };
    const actions = tradeCommodity(
      ship,
      offer,
      facility.requireComponents([...facilityComponents, "owner"])
    )!;

    // Move, dock, trade
    expect(actions).toHaveLength(3);

    ship.cp.orders.value.push({
      origin: "auto",
      type: "trade",
      actions,
    });

    expect(facility.cp.storage.allocations).toHaveLength(1);
    expect(facility.cp.budget.allocations).toHaveLength(1);
    expect(ship.cp.storage.allocations).toHaveLength(1);
    expect(faction.cp.budget.allocations).toHaveLength(0);

    removeOrder(ship, 0);

    expect(facility.cp.storage.allocations).toHaveLength(0);
    expect(facility.cp.budget.allocations).toHaveLength(0);
    expect(ship.cp.storage.allocations).toHaveLength(0);
    expect(faction.cp.budget.allocations).toHaveLength(0);
  });

  it("should work for buy orders", () => {
    const faction = createFaction("Faction", sim);
    changeBudgetMoney(faction.cp.budget, 10000);
    const sector = createSector(sim, {
      position: matrix([0, 0]),
      name: "Sector",
    });
    const ship = createShip(sim, {
      ...shipClasses.find((sc) => sc.slug === "courierA")!,
      position: matrix([0, 0]),
      owner: faction,
      sector,
    });

    const facility = createFacility(sim, {
      owner: faction,
      position: matrix([0, 0]),
      sector,
    });
    facility.cp.storage.max = 1000;
    addStorage(facility.cp.storage, commodity, quantity);
    facility.cp.trade.offers[commodity] = {
      active: true,
      price: 10,
      quantity,
      type: "sell",
    };

    const offer: TransactionInput = {
      budget: faction.id,
      commodity,
      factionId: faction.id,
      initiator: ship.id,
      price: 10,
      quantity,
      type: "buy",
      allocations: null,
    };
    const actions = tradeCommodity(
      ship,
      offer,
      facility.requireComponents([...facilityComponents, "owner"])
    )!;

    // Move, dock, trade
    expect(actions).toHaveLength(3);

    ship.cp.orders.value.push({
      origin: "auto",
      type: "trade",
      actions,
    });

    expect(facility.cp.storage.allocations).toHaveLength(1);
    expect(facility.cp.budget.allocations).toHaveLength(0);
    expect(ship.cp.storage.allocations).toHaveLength(1);
    expect(faction.cp.budget.allocations).toHaveLength(1);

    removeOrder(ship, 0);

    expect(facility.cp.storage.allocations).toHaveLength(0);
    expect(facility.cp.budget.allocations).toHaveLength(0);
    expect(ship.cp.storage.allocations).toHaveLength(0);
    expect(faction.cp.budget.allocations).toHaveLength(0);
  });
});
