import React from "react";
import groupBy from "lodash/groupBy";
import SVG from "react-inlinesvg";
import { RequireComponent } from "../../../tsHelpers";
import { Table, TableCell } from "./Table";
import { IconButton } from "./IconButton";
import locationIcon from "../../../../assets/ui/location.svg";

export interface ProductionProps {
  entity: RequireComponent<"modules">;
}

export const Production: React.FC<ProductionProps> = ({ entity }) => {
  const { modules } = entity.cp;
  const { productionModules, utilityModules } = groupBy(
    modules.ids
      .map(entity.sim.get)
      .map((e) => e.requireComponents(["parent", "name"])),
    (facilityModule) =>
      facilityModule.hasComponents(["production"])
        ? "productionModules"
        : "utilityModules"
  );

  return (
    <Table>
      <tbody>
        {productionModules.map((facilityModule, index) => (
          // eslint-disable-next-line react/no-array-index-key
          <tr key={`${facilityModule.cp.name!.value}-${index}`}>
            <TableCell>{facilityModule.cp.name!.value}</TableCell>
            <TableCell style={{ textAlign: "right" }}>
              {facilityModule.cooldowns.timers.production.toFixed(0)}s
            </TableCell>
          </tr>
        ))}
      </tbody>
      <tbody>
        {utilityModules.map((facilityModule, index) => {
          const teleport = facilityModule.cp.teleport?.destinationId
            ? entity.sim.get(facilityModule.cp.teleport?.destinationId)
            : null;

          return (
            // eslint-disable-next-line react/no-array-index-key
            <tr key={`${facilityModule.cp.name.value}-${index}`}>
              <TableCell>{facilityModule.cp.name.value}</TableCell>
              <TableCell>
                {teleport && (
                  <IconButton
                    onClick={() => {
                      const { selectionManager } = entity.sim
                        .find((e) => e.hasComponents(["selectionManager"]))!
                        .requireComponents(["selectionManager"]).cp;

                      selectionManager.id = teleport.cp.parent!.id;
                      selectionManager.focused = true;
                    }}
                  >
                    <SVG src={locationIcon} />
                  </IconButton>
                )}
              </TableCell>
            </tr>
          );
        })}
      </tbody>
    </Table>
  );
};
