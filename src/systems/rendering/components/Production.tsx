import React from "react";
import groupBy from "lodash/groupBy";
import { RequireComponent } from "../../../tsHelpers";
import { Table, TableCell } from "./Table";

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
        {productionModules.map((facilityModule, index) => (
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
          </tr>
        ))}
      </tbody>
    </Table>
  );
};
