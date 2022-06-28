import { asteroidFieldComponents } from "../archetypes/asteroidField";
import { sectorComponents } from "../archetypes/sector";
import { CoreComponents, Entity } from "../components/entity";
import { Sim } from "../sim";
import { RequireComponent } from "../tsHelpers";

type QueryEntities<T extends keyof CoreComponents> = Array<RequireComponent<T>>;

export class Query<T extends keyof CoreComponents> {
  entities: QueryEntities<T> | undefined;
  requiredComponents: readonly T[];
  sim: Sim;

  constructor(sim: Sim, requiredComponents: readonly T[]) {
    this.requiredComponents = requiredComponents;
    this.sim = sim;

    sim.events.on("add-component", (entity: Entity) => {
      if (this.entities && entity.hasComponents(this.requiredComponents)) {
        this.entities.push(entity as RequireComponent<T>);
      }
    });

    sim.events.on(
      "remove-component",
      (payload: { name: keyof CoreComponents; entity: Entity }) => {
        if (
          this.entities &&
          (this.requiredComponents as readonly string[]).includes(payload.name)
        ) {
          this.entities = this.entities.filter(
            (e) => e.id !== payload.entity.id
          );
        }
      }
    );

    sim.events.on("remove-entity", (entity: Entity) => {
      if (this.entities) {
        this.entities = this.entities.filter((e) => e.id !== entity.id);
      }
    });
  }

  get = (): QueryEntities<T> => {
    if (!this.entities) {
      this.entities = [...this.sim.entities.values()].filter((e) =>
        e.hasComponents(this.requiredComponents)
      ) as QueryEntities<T>;
    }

    return this.entities.filter((e) => !e.deleted);
  };

  reset = (): void => {
    this.entities = undefined;
  };
}

export function createQueries(sim: Sim) {
  return {
    asteroidFields: new Query(sim, asteroidFieldComponents),
    autoOrderable: new Query(sim, ["autoOrder", "commander", "orders"]),
    commendables: new Query(sim, ["commander"]),
    mining: new Query(sim, ["mining", "storage"]),
    orderable: new Query(sim, ["orders"]),
    productionByModules: new Query(sim, ["production", "parent"]),
    renderable: new Query(sim, ["render", "position"]),
    renderableGraphics: new Query(sim, ["renderGraphics", "position"]),
    sectors: new Query(sim, sectorComponents),
    selectable: new Query(sim, ["render", "position", "selection"]),
    selectionManager: new Query(sim, ["selectionManager"]),
    standaloneProduction: new Query(sim, ["production", "storage"]),
    storageAndTrading: new Query(sim, ["storage", "trade"]),
    teleports: new Query(sim, ["teleport"]),
    trading: new Query(sim, ["trade", "budget", "storage", "position"]),
  } as const;
}

export type Queries = ReturnType<typeof createQueries>;
