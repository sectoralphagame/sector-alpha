import { add, Matrix, matrix, random, subtract } from "mathjs";
import { Sector, sectorSize } from "../archetypes/sector";
import { hecsToCartesian } from "../components/hecsPosition";
import { createRenderGraphics } from "../components/renderGraphics";
import { linkTeleportModules } from "../components/teleport";
import { Sim } from "../sim";
import { createTeleporter } from "./facilities";

export function createLink(sim: Sim, sectors: Sector[]) {
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
    const position = hecsToCartesian(
      sector.cp.hecsPosition.value,
      sectorSize / 10
    );
    const a =
      (sectorIndex === 0 ? angle : Math.PI + angle) +
      random(-Math.PI / 6, Math.PI / 6);
    const r = random(20, 35);

    const teleporter = sim
      .getOrThrow(
        createTeleporter(
          {
            owner: undefined!,
            position: add(
              position,
              matrix([r * Math.cos(a), r * Math.sin(a)])
            ) as Matrix,
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
}
