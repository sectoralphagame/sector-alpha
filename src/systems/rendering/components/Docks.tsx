import React from "react";
import SVG from "react-inlinesvg";
import { Entity } from "../../../components/entity";
import locationIcon from "../../../../assets/ui/location.svg";
import { RequireComponent } from "../../../tsHelpers";
import { IconButton } from "./IconButton";
import { Table, TableCell } from "./Table";
import { nano } from "../../../style";
import { setEntity } from "../../../components/utils/entityId";

export interface DocksProps {
  entity: RequireComponent<"docks">;
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

export const Docks: React.FC<DocksProps> = ({ entity }) => {
  const { docks } = entity.cp;

  return docks.entities.length === 0 ? (
    <div>Empty docks</div>
  ) : (
    <Table>
      <thead>
        <tr>
          <th className={styles.colName}>Name</th>
          <th>&nbsp;</th>
        </tr>
      </thead>
      <tbody>
        {docks.entities.map((ship) => (
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

                  setEntity(selectionManager, ship.cp.commander!.entity);
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
