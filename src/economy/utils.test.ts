import { matrix } from "mathjs";
import { facilityModules } from "../archetypes/facilityModule";
import { createFaction, Faction } from "../archetypes/faction";
import { createSector, Sector } from "../archetypes/sector";
import { Entity } from "../components/entity";
import { hecsToCartesian } from "../components/hecsPosition";
import { linkTeleportModules } from "../components/teleport";
import { Sim } from "../sim/Sim";
import { regen } from "../systems/pathPlanning";
import { addFacilityModule } from "../utils/entityModules";
import { getSectorsInTeleportRange } from "./utils";

function createTeleporter(sim: Sim, sector: Sector, owner: Faction) {
  const facility = new Entity(sim);
  facility
    .addComponent({
      name: "position",
      angle: 0,
      coord: hecsToCartesian(sector.cp.hecsPosition.value, 1),
      sector: sector.id,
    })
    .addComponent({ name: "modules", ids: [] })
    .addComponent({
      name: "owner",
      id: owner.id,
    });
  addFacilityModule(
    facility as any,
    facilityModules.teleport.create(
      sim,
      facility.requireComponents(["position", "modules"])
    )
  );

  return facility.requireComponents(["modules"]);
}

describe("getSectorsInTeleportRange", () => {
  let sim: Sim;
  let sectors: Sector[];

  beforeEach(() => {
    sim = new Sim();
    sectors = [
      createSector(sim, { position: matrix([0, 0, 0]), name: "s1" }),
      createSector(sim, { position: matrix([1, 0, 0]), name: "s2" }),
      createSector(sim, { position: matrix([2, 0, 0]), name: "s3" }),
    ];
  });

  it("properly returns connected sectors", () => {
    const f = createFaction("F", sim);
    const t1 = createTeleporter(sim, sectors[0], f);
    const t2 = createTeleporter(sim, sectors[1], f);
    const t3 = createTeleporter(sim, sectors[1], f);
    const t4 = createTeleporter(sim, sectors[2], f);

    linkTeleportModules(
      sim.get(t1.cp.modules.ids[0]).requireComponents(["teleport"]),
      sim.get(t2.cp.modules.ids[0]).requireComponents(["teleport"])
    );
    linkTeleportModules(
      sim.get(t3.cp.modules.ids[0]).requireComponents(["teleport"]),
      sim.get(t4.cp.modules.ids[0]).requireComponents(["teleport"])
    );

    regen(sim);

    expect(getSectorsInTeleportRange(sectors[0], 0, sim)).toHaveLength(1);
    expect(getSectorsInTeleportRange(sectors[0], 1, sim)).toHaveLength(2);
    expect(getSectorsInTeleportRange(sectors[0], 2, sim)).toHaveLength(3);
    expect(getSectorsInTeleportRange(sectors[1], 1, sim)).toHaveLength(3);
  });
});
