import type { Matrix } from "mathjs";
import { add, matrix, random, subtract } from "mathjs";
import type { Sector } from "../archetypes/sector";
import { sectorSize } from "../archetypes/sector";
import { hecsToCartesian } from "../components/hecsPosition";
import { createRenderGraphics } from "../components/renderGraphics";
import { linkTeleportModules } from "../components/teleport";
import type { Sim } from "../sim";
import { createTeleporter } from "./facilities";

export function createLink(sim: Sim, sectors: Sector[], position?: number[][]) {
  const positionA = hecsToCartesian(
    sectors[0].cp.hecsPosition.value,
    sectorSize / 10
  );
  const positionB = hecsToCartesian(
    sectors[1].cp.hecsPosition.value,
    sectorSize / 10
  );

  const diff = subtract(positionB, positionA);
  const angle = Math.atan2(diff.get([1]), diff.get([0]));

  const [telA, telB] = sectors.map((sector, sectorIndex) => {
    let linkPosition: Matrix;
    if (!position?.[sectorIndex]) {
      const sectorPosition = hecsToCartesian(
        sector.cp.hecsPosition.value,
        sectorSize / 10
      );
      const a =
        (sectorIndex === 0 ? angle : Math.PI + angle) +
        random(-Math.PI / 6, Math.PI / 6);
      const r = random(20, 35);

      linkPosition = add(
        sectorPosition,
        matrix([r * Math.cos(a), r * Math.sin(a)])
      ) as Matrix;
    } else {
      linkPosition = matrix(position[sectorIndex]);
    }

    const teleporter = sim
      .getOrThrow(
        createTeleporter(
          {
            owner: undefined!,
            position: linkPosition,
            sector,
          },
          sim
        ).cp.modules.ids[0]
      )
      .requireComponents(["teleport"]);

    return teleporter;
  });
  telA.addComponent(createRenderGraphics("link"));

  linkTeleportModules(telA, telB);

  return [telA, telB];
}
