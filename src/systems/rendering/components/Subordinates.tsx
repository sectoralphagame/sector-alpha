import React from "react";
import SVG from "react-inlinesvg";
import { Entity } from "../../../components/entity";
import locationIcon from "../../../../assets/ui/location.svg";
import { IconButton } from "./IconButton";
import { Table, TableCell } from "./Table";
import { nano } from "../../../style";
import { ship as asShip } from "../../../archetypes/ship";
import { setEntity } from "../../../components/utils/entityId";

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
  const subordinates = (window.sim.entities as Entity[])
    .filter((e) => e?.cp.commander?.entity === entity)
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
                  const { selectionManager } = (window.sim.entities as Entity[])
                    .find((e) => e.hasComponents(["selectionManager"]))!
                    .requireComponents(["selectionManager"]).cp;

                  setEntity(
                    selectionManager,
                    ship.requireComponents(["selection"])
                  );
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
