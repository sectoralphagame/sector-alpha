import React from "react";
import groupBy from "lodash/groupBy";
import SVG from "react-inlinesvg";
import type { RequireComponent } from "@core/tsHelpers";
import locationIcon from "@assets/ui/location.svg";
import { Table, TableCell } from "@kit/Table";
import { IconButton } from "@kit/IconButton";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleSummary,
} from "@kit/Collapsible";
import configIcon from "@assets/ui/config.svg";
import { useGameDialog } from "@ui/atoms";
import { isOwnedByPlayer } from "@core/utils/misc";
import exclamationIcon from "@assets/ui/exclamation.svg";
import { Tooltip } from "@kit/Tooltip";
import Text from "@kit/Text";
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
  const [, setDialog] = useGameDialog();

  const openModuleManager: React.MouseEventHandler = (event) => {
    event.stopPropagation();
    setDialog({
      type: "facilityModuleManager",
      entityId: entity.id,
    });
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
                {(productionModules ?? []).map((facilityModule) => (
                  <tr key={facilityModule.id}>
                    <TableCell>{facilityModule.cp.name!.value}</TableCell>
                    <TableCell style={{ textAlign: "right" }}>
                      {facilityModule.cp.production!.active &&
                        !facilityModule.cp.production!.produced && (
                          <Tooltip
                            // eslint-disable-next-line react/no-unstable-nested-components
                            anchor={(ref) => (
                              <SVG
                                innerRef={ref}
                                src={exclamationIcon}
                                className={styles.haltedIcon}
                              />
                            )}
                          >
                            <Text variant="caption">
                              Production is halted. <br />
                              Does facility has enough resources?
                            </Text>
                          </Tooltip>
                        )}
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
