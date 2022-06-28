import { add, matrix, random, Matrix } from "mathjs";
import { createFacility, Facility } from "../archetypes/facility";
import { facilityModules } from "../archetypes/facilityModule";
import { Faction } from "../archetypes/faction";
import { sector as asSector, Sector, sectorSize } from "../archetypes/sector";
import { createShip } from "../archetypes/ship";
import { hecsToCartesian } from "../components/hecsPosition";
import { mineableCommodities } from "../economy/commodity";
import { Sim } from "../sim";
import { Cooldowns } from "../utils/cooldowns";
import { addFacilityModule } from "../utils/entityModules";
import { pickRandom } from "../utils/generators";
import { perCommodity } from "../utils/perCommodity";
import {
  getResourceProduction,
  getResourceUsage,
  getSectorResources,
} from "../utils/resources";
import { shipClasses } from "../world/ships";
import { System } from "./system";

const usageThreshold = 1.2;

function getFreighterTemplate() {
  const rnd = Math.random();

  if (rnd > 0.9) {
    return pickRandom(
      shipClasses.filter((s) => !s.mining && s.size === "large")
    );
  }

  if (rnd > 0.2) {
    return pickRandom(
      shipClasses.filter((s) => !s.mining && s.size === "medium")
    );
  }

  return pickRandom(shipClasses.filter((s) => !s.mining && s.size === "small"));
}

export class FacilityPlanningSystem extends System {
  cooldowns: Cooldowns<"plan">;

  constructor(sim: Sim) {
    super(sim);
    this.cooldowns = new Cooldowns("plan");
  }

  planMiningFacilities = (sector: Sector, faction: Faction): void => {
    const resources = getSectorResources(sector);
    const facilities = this.sim.queries.facilityWithProduction
      .get()
      .filter(
        (facility) =>
          facility.cp.owner?.id === faction.id &&
          facility.cp.position.sector === sector.id
      );
    // const minersInSector = this.sim.queries.commendables
    //   .get()
    //   .filter(
    //     (ship) =>
    //       ship.cp.position?.sector === sector.id &&
    //       ship.cp.owner?.id === faction.id &&
    //       ship.cp.mining
    //   );
    const resourceUsageInFacilities = getResourceUsage(facilities);
    const sectorPosition = hecsToCartesian(
      sector.cp.hecsPosition.value,
      sectorSize / 10
    );

    perCommodity((commodity) => {
      const canBeMined =
        resources[commodity].max > 0 &&
        resourceUsageInFacilities[commodity] === 0;

      if (!canBeMined) {
        return;
      }

      const facility = createFacility(this.sim, {
        owner: faction,
        position: add(
          sectorPosition,
          matrix([
            random(-sectorSize / 20, sectorSize / 20),
            random(-sectorSize / 20, sectorSize / 20),
          ])
        ) as Matrix,
        sector,
      });

      addFacilityModule(
        facility,
        facilityModules.containerSmall.create(this.sim, facility)
      );
      addFacilityModule(
        facility,
        Object.values(facilityModules)
          .find(
            (facilityModule) =>
              facilityModule.pac && facilityModule.pac[commodity]?.consumes
          )!
          .create(this.sim, facility)
      );

      createShip(this.sim, {
        ...pickRandom(shipClasses.filter((s) => s.mining)),
        position: add(
          facility.cp.position.coord,
          matrix([random(-3, 3), random(-3, 3)])
        ) as Matrix,
        owner: faction,
        sector,
      }).addComponent({
        name: "commander",
        id: facility.id,
      });

      if (Math.random() > 0.6) {
        createShip(this.sim, {
          ...getFreighterTemplate(),
          position: add(
            facility.cp.position.coord,
            matrix([random(-3, 3), random(-3, 3)])
          ) as Matrix,
          owner: faction,
          sector: asSector(this.sim.getOrThrow(facility.cp.position.sector)),
        }).addComponent({
          name: "commander",
          id: facility.id,
        });
      }
    });
  };

  planFactories = (faction: Faction): void => {
    const modulesToBuild: Array<
      typeof facilityModules[keyof typeof facilityModules]
    > = [];
    this.sim.queries.facilityWithProduction.reset();
    const facilities = this.sim.queries.facilityWithProduction
      .get()
      .filter((facility) => facility.cp.owner?.id === faction.id);
    const resourceUsageInFacilities = getResourceUsage(facilities);
    const resourcesProducedByFacilities = getResourceProduction(facilities);

    // eslint-disable-next-line no-constant-condition
    while (true) {
      const productionModule = Object.values(facilityModules).find(
        (facilityModule) =>
          facilityModule.pac &&
          Object.entries(facilityModule.pac).reduce(
            (hasSurplus, [commodity, { consumes, produces }]) =>
              (hasSurplus &&
                (produces
                  ? !Object.values<string>(mineableCommodities).includes(
                      commodity
                    )
                  : (consumes / facilityModule.time! +
                      resourceUsageInFacilities[commodity]) /
                      resourcesProducedByFacilities[commodity] <
                    usageThreshold)) ||
              Math.random() > 0.97,
            true
          )
      );
      if (!productionModule) break;
      modulesToBuild.push(productionModule);
      perCommodity((commodity) => {
        if (productionModule.pac && productionModule.pac[commodity]?.consumes) {
          resourceUsageInFacilities[commodity] +=
            productionModule.pac![commodity]!.consumes / productionModule.time!;
        }

        if (productionModule.pac && productionModule.pac[commodity]?.produces) {
          resourcesProducedByFacilities[commodity] +=
            productionModule.pac![commodity]!.produces / productionModule.time!;
        }
      });
    }

    let facility: Facility | undefined;

    while (modulesToBuild.length > 0) {
      if (!facility || Math.random() > 0.6) {
        const sector = pickRandom(
          this.sim.queries.sectors
            .get()
            .filter((s) => s.cp.owner?.id === faction.id)
        );
        const sectorPosition = hecsToCartesian(
          sector.cp.hecsPosition.value,
          sectorSize / 10
        );

        facility = createFacility(this.sim, {
          owner: faction,
          position: add(
            sectorPosition,
            matrix([
              random(-sectorSize / 20, sectorSize / 20),
              random(-sectorSize / 20, sectorSize / 20),
            ])
          ) as Matrix,
          sector,
        });
      }

      const facilityModule = modulesToBuild.pop()!;

      addFacilityModule(
        facility,
        facilityModules.containerSmall.create(this.sim, facility)
      );
      addFacilityModule(facility, facilityModule.create(this.sim, facility));

      createShip(this.sim, {
        ...getFreighterTemplate(),
        position: add(
          facility.cp.position.coord,
          matrix([random(-3, 3), random(-3, 3)])
        ) as Matrix,
        owner: faction,
        sector: asSector(this.sim.getOrThrow(facility.cp.position.sector)),
      }).addComponent({
        name: "commander",
        id: facility.id,
      });
    }
  };

  exec = (): void => {
    // TODO: remove time limitation after introducing station builders
    if (this.cooldowns.canUse("plan") && this.sim.getTime() === 0) {
      this.cooldowns.use("plan", 500);

      this.sim.queries.ai.get().forEach((faction) => {
        this.sim.queries.sectors
          .get()
          .filter((sector) => sector.cp.owner?.id === faction.id)
          .forEach((sector) => {
            this.planMiningFacilities(sector, faction);
          });

        if (faction.cp.ai.type === "territorial") {
          this.planFactories(faction);
        }
      });
    }
  };
}
