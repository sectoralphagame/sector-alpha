import { matrix } from "mathjs";
import { facilityModules } from "../archetypes/facilityModule";
import { createSector, Sector } from "../archetypes/sector";
import { Entity } from "../components/entity";
import { Modules } from "../components/modules";
import { Owner } from "../components/owner";
import { Position } from "../components/position";
import { Sim } from "../sim/Sim";
import { addFacilityModule } from "../utils/entityModules";
import { Faction } from "./faction";
import { getSectorsInTeleportRange } from "./utils";

function createTeleporter(sim: Sim, sector: Sector, owner: Faction) {
  const facility = new Entity(sim);
  facility.addComponent(
    "position",
    new Position(sector.cp.hecsPosition.toCartesian(1), 0, sector)
  );
  facility.addComponent("modules", new Modules());
  addFacilityModule(
    facility as any,
    facilityModules.teleport(
      sim,
      facility.requireComponents(["position", "modules"])
    )
  );
  facility.addComponent("owner", new Owner(owner));

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
    const f = new Faction("f");
    const t1 = createTeleporter(sim, sectors[0], f);
    const t2 = createTeleporter(sim, sectors[1], f);
    const t3 = createTeleporter(sim, sectors[1], f);
    const t4 = createTeleporter(sim, sectors[2], f);

    t1.cp.modules.modules[0]
      .requireComponents(["teleport"])
      .cp.teleport!.link(
        t1.cp.modules.modules[0].requireComponents(["teleport"]),
        t2.cp.modules.modules[0].requireComponents(["teleport"])
      );
    t3.cp.modules.modules[0]
      .requireComponents(["teleport"])
      .cp.teleport!.link(
        t3.cp.modules.modules[0].requireComponents(["teleport"]),
        t4.cp.modules.modules[0].requireComponents(["teleport"])
      );

    expect(getSectorsInTeleportRange(sectors[0], 0, sim)).toHaveLength(1);
    expect(getSectorsInTeleportRange(sectors[0], 1, sim)).toHaveLength(3);
    expect(getSectorsInTeleportRange(sectors[0], 2, sim)).toHaveLength(4);
    expect(getSectorsInTeleportRange(sectors[1], 1, sim)).toHaveLength(4);
  });
});
