import React from "react";
import SVG from "react-inlinesvg";
import { Entity } from "../../../components/entity";
import locationIcon from "../../../../assets/ui/location.svg";
import { IconButton } from "./IconButton";
import { Table, TableCell } from "./Table";
import { nano } from "../../../style";
import { ship as asShip } from "../../../archetypes/ship";

export interface SubordinatesProps {
  entity: Entity;
}

const styles = nano.sheet({
  colAction: {
    width: "48px",
    textAlign: "right",
  },
  colName: {
    textAlign: "left",
  },
});

export const Subordinates: React.FC<SubordinatesProps> = ({ entity }) => {
  const subordinates = entity.sim.queries.commendables
    .get()
    .filter((e) => e?.cp.commander?.id === entity.id)
    .map(asShip);

  return subordinates.length === 0 ? (
    <div>No Subordinates</div>
  ) : (
    <Table>
      <thead>
        <tr>
          <th className={styles.colName}>Name</th>
          <th>&nbsp;</th>
        </tr>
      </thead>
      <tbody>
        {subordinates.map((ship) => (
          <tr key={ship.id}>
            <TableCell className={styles.colName}>
              {ship.cp.name?.value}
            </TableCell>
            <TableCell className={styles.colAction}>
              <IconButton
                onClick={() => {
                  const { selectionManager } = entity.sim
                    .find((e) => e.hasComponents(["selectionManager"]))!
                    .requireComponents(["selectionManager"]).cp;

                  selectionManager.id = ship.id;
                  selectionManager.focused = true;
                }}
              >
                <SVG src={locationIcon} />
              </IconButton>
            </TableCell>
          </tr>
        ))}
      </tbody>
    </Table>
  );
};
