import React from "react";
import groupBy from "lodash/groupBy";
import SVG from "react-inlinesvg";
import { RequireComponent } from "../../../tsHelpers";
import { Table, TableCell } from "./Table";
import { IconButton } from "./IconButton";
import locationIcon from "../../../../assets/ui/location.svg";
import { Entity } from "../../../components/entity";
import { setEntity } from "../../../components/utils/entityId";

export interface ProductionProps {
  entity: RequireComponent<"modules">;
}

export const Production: React.FC<ProductionProps> = ({ entity }) => {
  const { modules } = entity.cp;
  const { productionModules, utilityModules } = groupBy(
    modules.entities,
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
              {facilityModule.cooldowns.timers.production.toFixed(0)}s
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
              {facilityModule.cp.teleport?.entity && (
                <IconButton
                  onClick={() => {
                    const { selectionManager } = (
                      window.sim.entities as Entity[]
                    )
                      .find((e) => e.hasComponents(["selectionManager"]))!
                      .requireComponents(["selectionManager"]).cp;

                    setEntity(
                      selectionManager,
                      facilityModule.cp.teleport!.entity!.cp.parent!.entity
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
