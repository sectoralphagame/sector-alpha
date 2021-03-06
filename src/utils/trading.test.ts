import { matrix } from "mathjs";
import { Facility, facilityComponents } from "../archetypes/facility";
import { createFaction } from "../archetypes/faction";
import { createSector, Sector } from "../archetypes/sector";
import { changeBudgetMoney } from "../components/budget";
import { addStorage, removeStorage } from "../components/storage";
import { Sim } from "../sim";
import { settleStorageQuota } from "../systems/storageQuotaPlanning";
import { createOffers } from "../systems/trading";
import { createFarm, createWaterFacility } from "../world/facilities";
import { allocate, getNeededCommodities, tradeCommodity } from "./trading";
import { createShip, Ship } from "../archetypes/ship";
import { shipClasses } from "../world/ships";
import { dockShip } from "../systems/orderExecuting/dock";
import { tradeOrder } from "../systems/orderExecuting/trade";
import { TradeOrder } from "../components/orders";
import { Commodity } from "../economy/commodity";
import { RequireComponent } from "../tsHelpers";

describe("Trading module", () => {
  let sim: Sim;
  let facility: Facility & RequireComponent<"compoundProduction">;
  let sector: Sector;

  beforeEach(() => {
    sim = new Sim();
    // Run path planning
    sim.systems[0].exec(0);

    sector = createSector(sim, { name: "", position: matrix([0, 0, 0]) });
    facility = createFarm(
      {
        position: matrix([0, 0]),
        owner: createFaction("F", sim),
        sector,
      },
      sim
    ).requireComponents([...facilityComponents, "compoundProduction"]);
    facility.cp.budget.allocationIdCounter = 10;
    changeBudgetMoney(facility.cp.budget, 100);
  });

  it("properly sorts by most needed commodity 1", () => {
    settleStorageQuota(facility);
    createOffers(facility);

    expect(getNeededCommodities(facility)).toEqual(["water", "fuel"]);
  });

  it("properly sorts by most needed commodity 2", () => {
    removeStorage(facility.cp.storage, "food", 50);
    addStorage(facility.cp.storage, "water", 10);
    settleStorageQuota(facility);
    createOffers(facility);

    expect(facility.cp.trade.offers.food.quantity).not.toBeGreaterThan(0);
    expect(facility.cp.trade.offers.fuel.type).toBe("buy");
    expect(facility.cp.trade.offers.water.type).toBe("buy");
    expect(getNeededCommodities(facility)).toEqual(["fuel", "water"]);
  });

  it("properly allocates budget and storage for buy offers", () => {
    addStorage(facility.cp.storage, "food", 100, true);
    facility.cp.trade.offers.food = { price: 20, quantity: 100, type: "sell" };
    const shipFaction = createFaction("Ship faction", sim);
    changeBudgetMoney(shipFaction.cp.budget, 100);

    const allocations = allocate(facility, {
      budget: shipFaction.id,
      commodity: "food",
      initiator: 4,
      factionId: shipFaction.id,
      price: 20,
      quantity: 5,
      type: "buy",
    });

    expect(allocations).toBeTruthy();
    expect(allocations.storage.id).toBe(1);
    expect(shipFaction.cp.budget.allocations).toHaveLength(1);
    expect(shipFaction.cp.budget.allocations[0].id).toBe(1);
    expect(facility.cp.storage.allocations).toHaveLength(1);
    expect(facility.cp.storage.allocations[0].id).toBe(1);
  });

  it("properly allocates budget and storage for sell offers", () => {
    addStorage(facility.cp.storage, "food", 100, true);
    facility.cp.trade.offers.water = { price: 20, quantity: 100, type: "buy" };
    const shipFaction = createFaction("Ship faction", sim);
    changeBudgetMoney(shipFaction.cp.budget, 0);

    allocate(facility, {
      budget: shipFaction.id,
      commodity: "water",
      initiator: 4,
      factionId: shipFaction.id,
      price: 20,
      quantity: 5,
      type: "sell",
    });

    expect(shipFaction.cp.budget.allocations).toHaveLength(0);
    expect(facility.cp.budget.allocations).toHaveLength(1);
    expect(facility.cp.budget.allocations[0].id).toBe(10);
    expect(facility.cp.storage.allocations).toHaveLength(1);
    expect(facility.cp.storage.allocations[0].id).toBe(1);
  });

  it("properly arranges trade between facilities", () => {
    addStorage(facility.cp.storage, "food", 100, true);
    settleStorageQuota(facility);
    createOffers(facility);

    const waterFacility = createWaterFacility(
      { owner: createFaction("F2", sim), position: matrix([0, 0]), sector },
      sim
    );
    settleStorageQuota(waterFacility);
    createOffers(waterFacility);

    const shipFaction = createFaction("Ship faction", sim);
    changeBudgetMoney(shipFaction.cp.budget, 100);
    const ship = createShip(sim, {
      ...shipClasses[0],
      owner: shipFaction,
      position: matrix([0, 0, 0]),
      sector,
    });

    const result = tradeCommodity(ship, "water", facility, waterFacility);

    expect(result).toBe(true);
    expect(shipFaction.cp.budget.allocations).toHaveLength(1);
    expect(facility.cp.budget.allocations).toHaveLength(1);
    expect(facility.cp.budget.allocations[0].id).toBe(10);
    expect(facility.cp.storage.allocations).toHaveLength(1);
    expect(facility.cp.storage.allocations[0].id).toBe(1);
    expect(waterFacility.cp.storage.allocations).toHaveLength(1);
    expect(waterFacility.cp.storage.allocations[0].id).toBe(1);
  });
});

function trade(
  ship: Ship,
  commodity: Commodity,
  buyer: Facility,
  seller: Facility
) {
  const result = tradeCommodity(ship, commodity, buyer, seller);

  expect(result).toBe(true);

  const shipFactionBudget = ship.sim.getOrThrow(ship.cp.owner.id).cp.budget;
  let prevShipFactionBudget = shipFactionBudget.available;
  dockShip(ship, seller);
  const buyOrderIndex = ship.cp.orders.value[0].orders.findIndex(
    (o) => o.type === "trade"
  );
  const buyOrder = ship.cp.orders.value[0].orders.splice(
    buyOrderIndex,
    1
  )[0] as TradeOrder;
  const buyResult = tradeOrder(ship, buyOrder);

  expect(shipFactionBudget.available).toBeLessThanOrEqual(
    prevShipFactionBudget
  );
  expect(buyResult).toBe(true);

  prevShipFactionBudget = shipFactionBudget.available;
  dockShip(ship, buyer);
  const sellOrder = ship.cp.orders.value[0].orders.find(
    (o) => o.type === "trade"
  ) as TradeOrder;
  const sellResult = tradeOrder(ship, sellOrder);

  expect(shipFactionBudget.available).toBeGreaterThanOrEqual(
    prevShipFactionBudget
  );
  expect(sellResult).toBe(true);
}

describe("Trade flow", () => {
  let sim: Sim;

  beforeAll(() => {
    sim = new Sim();
    // Run path planning
    sim.systems[0].exec(0);
  });

  it("between factions", () => {
    const sector = createSector(sim, { name: "", position: matrix([0, 0, 0]) });
    const farm = createFarm(
      {
        position: matrix([0, 0]),
        owner: createFaction("F", sim),
        sector,
      },
      sim
    );
    changeBudgetMoney(farm.cp.budget, 10000);
    settleStorageQuota(farm);
    createOffers(farm);
    farm.cp.trade.offers.water.price = 110;

    const waterFacility = createWaterFacility(
      { owner: createFaction("F2", sim), position: matrix([0, 0]), sector },
      sim
    );
    settleStorageQuota(waterFacility);
    createOffers(waterFacility);
    waterFacility.cp.trade.offers.water.price = 90;

    const shipFaction = createFaction("Ship faction", sim);
    changeBudgetMoney(shipFaction.cp.budget, 1000000);
    const prevShipFactionBudget = shipFaction.cp.budget.available;
    const ship = createShip(sim, {
      ...shipClasses[0],
      owner: shipFaction,
      position: matrix([0, 0, 0]),
      sector,
    });

    trade(ship, "water", farm, waterFacility);
    expect(shipFaction.cp.budget.available).toBeGreaterThan(
      prevShipFactionBudget
    );
  });

  it("within the same faction", () => {
    const sector = createSector(sim, { name: "", position: matrix([0, 0, 0]) });
    const f = createFaction("F", sim);
    const farm = createFarm(
      {
        position: matrix([0, 0]),
        owner: f,
        sector,
      },
      sim
    );
    changeBudgetMoney(farm.cp.budget, 100);
    settleStorageQuota(farm);
    createOffers(farm);

    const waterFacility = createWaterFacility(
      {
        owner: f,
        position: matrix([0, 0]),
        sector,
      },
      sim
    );
    settleStorageQuota(waterFacility);
    createOffers(waterFacility);

    const ship = createShip(sim, {
      ...shipClasses[0],
      owner: f,
      position: matrix([0, 0, 0]),
      sector,
    });

    trade(ship, "water", farm, waterFacility);
  });
});
