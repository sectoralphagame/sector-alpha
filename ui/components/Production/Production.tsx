import React from "react";
import groupBy from "lodash/groupBy";
import SVG from "react-inlinesvg";
import { RequireComponent } from "@core/tsHelpers";
import locationIcon from "@assets/ui/location.svg";
import { Table, TableCell } from "@kit/Table";
import { IconButton } from "@kit/IconButton";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleSummary,
} from "@kit/Collapsible";
import { isOwnedByPlayer } from "@core/components/player";
import configIcon from "@assets/ui/config.svg";
import styles from "./Production.scss";

export interface ProductionProps {
  entity: RequireComponent<"modules">;
}

export const Production: React.FC<ProductionProps> = ({ entity }) => {
  const { modules } = entity.cp;
  const { productionModules, utilityModules } = groupBy(
    modules.ids
      .map(entity.sim.getOrThrow)
      .map((e) => e.requireComponents(["parent", "name"])),
    (facilityModule) =>
      facilityModule.hasComponents(["production"])
        ? "productionModules"
        : "utilityModules"
  );

  const openModuleManager: React.MouseEventHandler = (event) => {
    event.stopPropagation();
  };

  return (
    <>
      <Collapsible>
        <CollapsibleSummary>
          <div className={styles.summary}>
            <span>Modules</span>
            {isOwnedByPlayer(entity) && (
              <IconButton
                className={styles.manage}
                variant="naked"
                onClick={openModuleManager}
              >
                <SVG src={configIcon} />
              </IconButton>
            )}
          </div>
        </CollapsibleSummary>
        <CollapsibleContent>
          {productionModules?.length > 0 || utilityModules?.length > 0 ? (
            <Table>
              <tbody>
                {(productionModules ?? []).map((facilityModule, index) => (
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
                {(utilityModules ?? []).map((facilityModule, index) => {
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
                                .find((e) =>
                                  e.hasComponents(["selectionManager"])
                                )!
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
          ) : (
            <div>This facility has no modules built yet</div>
          )}
        </CollapsibleContent>
      </Collapsible>
      {null}
    </>
  );
};
