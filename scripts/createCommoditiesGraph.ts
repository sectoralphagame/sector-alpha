import { commodityLabel } from "@core/economy/commodity";
import facilityModules from "../core/world/data/facilityModules.json";

let graph = `
graph TD
  classDef default fill:#fcc5c5,stroke:#fff;
  classDef module fill:#f3f3f3,font-size:0.8em,font-style:italic,stroke:#fff;

`;
let edgeCount = 0;

for (const facilityModule of facilityModules) {
  if (facilityModule.type !== "production" || facilityModule.pac!.tauMetal)
    continue;

  // eslint-disable-next-line guard-for-in
  for (const commodity in facilityModule.pac!) {
    if (facilityModule.pac[commodity].consumes) {
      if (commodity === "fuel") continue;
      graph += `  ${commodity}(${commodityLabel[commodity]}) --> ${facilityModule.slug}[${facilityModule.name}]:::module\n`;
      edgeCount++;
    }
    if (facilityModule.pac[commodity].produces) {
      graph += `  ${facilityModule.slug}[${facilityModule.name}]:::module --> ${commodity}(${commodityLabel[commodity]})\n`;
      if (facilityModule.pac.fuel?.consumes) {
        graph += `  linkStyle ${edgeCount} stroke:orange;\n`;
      }
      edgeCount++;
    }
  }
}

// eslint-disable-next-line no-console
console.log(graph);
