import React from "react";
import { Sector } from "../../archetypes/sector";
import { getSectorResources } from "../../economy/utils";
import { Table, TableCell } from "./Table";

const Resources: React.FC<{ entity: Sector }> = ({ entity }) => {
  const fieldsByType = getSectorResources(entity);
  if (!fieldsByType) return null;

  return (
    <Table>
      <tbody>
        {Object.entries(fieldsByType).map(
          ([commodity, amount]) =>
            amount > 0 && (
              <tr key={commodity}>
                <TableCell>{commodity}</TableCell>
                <TableCell>{amount.toFixed(0)}</TableCell>
              </tr>
            )
        )}
      </tbody>
    </Table>
  );
};

export default Resources;
