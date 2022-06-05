import { MissingEntityError } from "../errors";
import { Sim } from "../sim";
import { RequireComponent } from "../tsHelpers";

type WithTeleport = RequireComponent<"teleport">;

export class Teleport {
  destination: WithTeleport;
  destinationId: number;

  link = (entity: WithTeleport, destination: WithTeleport) => {
    this.setDestination(destination);
    destination.cp.teleport.setDestination(entity);
  };

  load = (sim: Sim) => {
    const entity = sim.entities.find((e) => e.id === this.destinationId);
    if (!entity) {
      throw new MissingEntityError(this.destinationId);
    }
    this.destination = entity.requireComponents(["teleport"]);
  };

  setDestination = (destination: WithTeleport) => {
    this.destination = destination;
    this.destinationId = destination.id;
  };
}
