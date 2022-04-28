import { CoreComponents, Entity } from "../components/entity";
import { Sim } from "../sim";
import { RequireComponent } from "../tsHelpers";

type QueryEntities<T extends keyof CoreComponents> = Array<RequireComponent<T>>;

export class Query<T extends keyof CoreComponents> {
  entities: QueryEntities<T>;
  requiredComponents: T[];
  sim: Sim;

  constructor(sim: Sim, requiredComponents: T[]) {
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
        if ((this.requiredComponents as string[]).includes(payload.name)) {
          this.entities = this.entities.filter(
            (e) => e.id !== payload.entity.id
          );
        }
      }
    );
  }

  get = (): QueryEntities<T> => {
    if (!this.entities) {
      this.entities = this.sim.entities.filter((e) =>
        e.hasComponents(this.requiredComponents)
      ) as QueryEntities<T>;
    }

    return this.entities;
  };
}

export function createQueries(sim: Sim) {
  return {
    asteroidFields: new Query(sim, ["asteroidSpawn"]),
    autoOrderable: new Query(sim, ["autoOrder", "commander", "orders"]),
    mining: new Query(sim, ["mining", "storage"]),
    orderable: new Query(sim, ["orders"]),
    productionByModules: new Query(sim, ["production", "parent"]),
    renderable: new Query(sim, ["render", "position"]),
    selectable: new Query(sim, ["render", "position", "selection"]),
    selectionManager: new Query(sim, ["selectionManager"]),
    standaloneProduction: new Query(sim, ["production", "storage"]),
    storageAndTrading: new Query(sim, ["storage", "trade"]),
    trading: new Query(sim, ["trade", "budget", "storage"]),
  } as const;
}

export type Queries = ReturnType<typeof createQueries>;
