import React from "react";
import { Sector } from "@core/archetypes/sector";
import { getSectorResources } from "@core/utils/resources";
import { Table, TableCell } from "@kit/Table";

const Resources: React.FC<{ entity: Sector }> = ({ entity }) => {
  const fieldsByType = getSectorResources(entity);
  if (!fieldsByType) return null;

  return (
    <Table>
      <thead>
        <tr>
          <TableCell>Name</TableCell>
          <TableCell>Available</TableCell>
          <TableCell>Max</TableCell>
        </tr>
      </thead>
      <tbody>
        {Object.entries(fieldsByType).map(
          ([commodity, resources]) =>
            resources.max > 0 && (
              <tr key={commodity}>
                <TableCell>{commodity}</TableCell>
                <TableCell>{resources.available.toFixed(0)}</TableCell>
                <TableCell>{resources.max.toFixed(0)}</TableCell>
              </tr>
            )
        )}
      </tbody>
    </Table>
  );
};

export default Resources;
