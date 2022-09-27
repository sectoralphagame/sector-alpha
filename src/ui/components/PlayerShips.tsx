import React from "react";
import SVG from "react-inlinesvg";
import locationIcon from "../../../assets/ui/location.svg";
import { IconButton } from "./IconButton";
import { Table, TableCell } from "./Table";
import { nano } from "../../style";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleSummary,
} from "./Collapsible";
import { useSim } from "../atoms";

const styles = nano.sheet({
  colAction: {
    width: "48px",
    textAlign: "right",
  },
  colName: {
    textAlign: "left",
  },
});

export const PlayerShips: React.FC = () => {
  const [sim] = useSim();
  const ships = sim.queries.orderable
    .get()
    .filter((ship) => ship.cp.owner?.id === sim.queries.player.get()[0].id);

  return (
    <Collapsible>
      <CollapsibleSummary>Owned Ships</CollapsibleSummary>
      <CollapsibleContent>
        {ships.length === 0 ? (
          <div>No docked ships</div>
        ) : (
          <Table>
            <thead>
              <tr>
                <th className={styles.colName}>Name</th>
                <th>&nbsp;</th>
              </tr>
            </thead>
            <tbody>
              {ships.map((ship) => (
                <tr key={ship.id}>
                  <TableCell className={styles.colName}>
                    {ship.cp.name?.value}
                  </TableCell>
                  <TableCell className={styles.colAction}>
                    <IconButton
                      onClick={() => {
                        const { selectionManager } = sim
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
        )}
      </CollapsibleContent>
    </Collapsible>
  );
};

PlayerShips.displayName = "PlayerShips";
