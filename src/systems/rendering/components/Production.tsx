import React from "react";
import groupBy from "lodash/groupBy";
import SVG from "react-inlinesvg";
import { RequireComponent } from "../../../tsHelpers";
import { Table, TableCell } from "./Table";
import { IconButton } from "./IconButton";
import locationIcon from "../../../../assets/ui/location.svg";
import { Entity } from "../../../components/entity";

export interface ProductionProps {
  entity: RequireComponent<"modules">;
}

export const Production: React.FC<ProductionProps> = ({ entity }) => {
  const { modules } = entity.cp;
  const { productionModules, utilityModules } = groupBy(
    modules.modules,
    (facilityModule) =>
      facilityModule.hasComponents(["production"])
        ? "productionModules"
        : "utilityModules"
  );

  return (
    <Table>
      <tbody>
        {productionModules?.map((facilityModule, index) => (
          // eslint-disable-next-line react/no-array-index-key
          <tr key={`${facilityModule.cp.name.value}-${index}`}>
            <TableCell>{facilityModule.cp.name.value}</TableCell>
            <TableCell style={{ textAlign: "right" }}>
              {facilityModule.cp.production!.cooldowns.timers.production.toFixed(
                0
              )}
              s
            </TableCell>
          </tr>
        ))}
      </tbody>
      <tbody>
        {utilityModules.map((facilityModule, index) => (
          // eslint-disable-next-line react/no-array-index-key
          <tr key={`${facilityModule.cp.name.value}-${index}`}>
            <TableCell>{facilityModule.cp.name.value}</TableCell>
            <TableCell>
              {facilityModule.cp.teleport?.destination && (
                <IconButton
                  onClick={() => {
                    const { selectionManager } = (
                      window.sim.entities as Entity[]
                    )
                      .find((e) => e.hasComponents(["selectionManager"]))!
                      .requireComponents(["selectionManager"]).cp;

                    selectionManager.set(
                      facilityModule.cp.teleport!.destination.cp.parent!.value
                    );
                    selectionManager.focused = true;
                  }}
                >
                  <SVG src={locationIcon} />
                </IconButton>
              )}
            </TableCell>
          </tr>
        ))}
      </tbody>
    </Table>
  );
};
