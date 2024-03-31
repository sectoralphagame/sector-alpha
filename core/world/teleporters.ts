import type { Position2D } from "@core/components/position";
import { random, subtract } from "mathjs";
import type { Sector } from "../archetypes/sector";
import { sectorSize } from "../archetypes/sector";
import { hecsToCartesian } from "../components/hecsPosition";
import { createRenderGraphics } from "../components/renderGraphics";
import { linkTeleportModules } from "../components/teleport";
import type { Sim } from "../sim";
import { createTeleporter } from "./facilities";

export function createLink(
  sim: Sim,
  sectors: Sector[],
  position?: Position2D[]
) {
  const positionA = hecsToCartesian(
    sectors[0].cp.hecsPosition.value,
    sectorSize / 10
  );
  const positionB = hecsToCartesian(
    sectors[1].cp.hecsPosition.value,
    sectorSize / 10
  );

  const diff = subtract(positionB, positionA);
  const angle = Math.atan2(diff[1], diff[0]);

  const [telA, telB] = sectors.map((sector, sectorIndex) => {
    let linkPosition: Position2D;
    if (!position?.[sectorIndex]) {
      const a =
        (sectorIndex === 0 ? angle : Math.PI + angle) +
        random(-Math.PI / 6, Math.PI / 6);
      const r = random(20, 35);

      linkPosition = [r * Math.cos(a), r * Math.sin(a)];
    } else {
      linkPosition = position[sectorIndex];
    }
    const facility = createTeleporter(
      {
        owner: undefined!,
        position: linkPosition,
        sector,
      },
      sim
    );

    const teleporter = sim
      .getOrThrow(facility.cp.modules.ids[0])
      .requireComponents(["teleport"]);

    facility.removeTag("selection");
    return teleporter;
  });
  telA.addComponent(createRenderGraphics("link"));

  linkTeleportModules(telA, telB);

  return [telA, telB];
}
