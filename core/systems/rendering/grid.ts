import * as PIXI from "pixi.js";
import { Graphics } from "@pixi/graphics";
import "@pixi/graphics-extras";

const a = (2 * Math.PI) / 6;
const size = 5000;

export function gridHex(
  radius: number,
  container: PIXI.Container,
  lineStyle: PIXI.ILineStyleOptions
) {
  const g = new Graphics();
  container.addChild(g);
  g.lineStyle(lineStyle);

  for (let x = 0; x < size; x += (radius * 3) / 2) {
    for (let y = 0; y < size; y += (radius * Math.sqrt(3)) / 2) {
      g.drawRegularPolygon!(x - size / 2, y - size / 2, radius / 2, 6, a / 2);
      g.moveTo(x - size / 2 + radius / 2, y - size / 2);
      g.lineTo(x - size / 2 + radius, y - size / 2);
    }
  }
}
