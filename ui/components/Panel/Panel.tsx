import configIcon from "@assets/ui/config.svg";
import SVG from "react-inlinesvg";
import React from "react";
import { shipComponents, ship as asShip } from "@core/archetypes/ship";
import { Tab, TabGroup, TabList, TabPanel, TabPanels } from "@kit/Tabs";
import type { Entity } from "@core/entity";
import {
  facilityComponents,
  facility as asFacility,
} from "@core/archetypes/facility";
import { sector, sectorComponents } from "@core/archetypes/sector";
import { IconButton } from "@kit/IconButton";
import { isOwnedByPlayer } from "@core/utils/misc";
import FacilityPanel from "../FacilityPanel";
import ShipPanel from "../ShipPanel";
import { ConfigDialog } from "../ConfigDialog";
import EntityName from "../EntityName";
import Resources from "../Resources";
import SectorResources from "../SectorStats";
import SectorPrices from "../SectorPrices";
import Inflation from "../InflationStats";
import { useGameDialog, useSim } from "../../atoms";
import { PlayerShips } from "../PlayerShips";
import { PlayerFacilities } from "../PlayerFacilities";
import { TradeDialog } from "../TradeDialog";
import { PanelComponent } from "./PanelComponent";
import { FacilityModuleManager } from "../FacilityModuleManager";
import Journal from "../Journal";
import styles from "./Panel.scss";
import { Offers } from "../Offers";
import { Undeploy } from "../Undeploy";
import { Subordinates } from "../Subordinates";
import { FacilityMoneyManager } from "../FacilityMoneyManager ";
import { Allocations } from "../Allocations";
import { FacilityTradeManager } from "../FacilityTradeManager";

export interface PanelProps {
  expanded?: boolean;
  entity: Entity | undefined;
}

const JournalWrapper: React.FC<{ entity: Entity }> = ({ entity, children }) =>
  entity.hasComponents(["journal"]) ? (
    <TabGroup>
      <TabList className={styles.tab}>
        <Tab>General</Tab>
        <Tab>Journal</Tab>
      </TabList>
      <TabPanels>
        <TabPanel>{children}</TabPanel>
        <TabPanel>
          <Journal entity={entity.requireComponents(["journal"])} />
        </TabPanel>
      </TabPanels>
    </TabGroup>
  ) : (
    (children as any)
  );

export const Panel: React.FC<PanelProps> = ({ entity, expanded }) => {
  const [isCollapsed, setCollapsed] = React.useState(!expanded);
  const [dialog, setDialog] = useGameDialog();
  const toggleCollapse = React.useCallback(() => setCollapsed((c) => !c), []);

  const [sim] = useSim();

  const closeDialog = React.useCallback(() => setDialog(null), []);

  React.useEffect(() => {
    if (entity && isCollapsed) {
      toggleCollapse();
    }
  }, [entity]);

  React.useEffect(() => {
    if (!sim) return;
    if (dialog?.type === "config") {
      sim.stop();
    }
  }, [dialog]);

  const playerOwned = entity ? isOwnedByPlayer(entity) : false;

  return (
    <>
      <PanelComponent
        isCollapsed={isCollapsed}
        onCollapseToggle={toggleCollapse}
        onConfig={() => setDialog({ type: "config" })}
        onFocus={
          entity
            ? () => {
                sim.find((e) =>
                  e.hasComponents(["selectionManager"])
                )!.cp.selectionManager!.focused = true;
              }
            : undefined
        }
        onPause={sim?.pause}
        onPlay={() => {
          sim.setSpeed(1);
          sim.start();
        }}
        onSpeed={() => {
          sim.setSpeed(10);
          sim.start();
        }}
      >
        {!isCollapsed &&
          (entity ? (
            <>
              {entity.hasComponents(["name"]) && (
                <EntityName entity={entity.requireComponents(["name"])} />
              )}
              <JournalWrapper entity={entity}>
                {entity.hasComponents(["trade", "storage", "budget"]) && (
                  <>
                    <div>
                      Money: {entity.components.budget!.available.toFixed(0)}
                      {playerOwned && (
                        <IconButton
                          className={styles.manage}
                          variant="naked"
                          onClick={() =>
                            setDialog({
                              type: "facilityMoneyManager",
                              entityId: entity.id,
                            })
                          }
                        >
                          <SVG src={configIcon} />
                        </IconButton>
                      )}
                    </div>
                    <hr />
                    <Offers
                      entity={entity.requireComponents([
                        "trade",
                        "storage",
                        "budget",
                      ])}
                      onManage={
                        playerOwned
                          ? () =>
                              setDialog({
                                type: "facilityTradeManager",
                                entityId: entity.id,
                              })
                          : undefined
                      }
                    />
                    <hr />
                  </>
                )}
                {entity.hasComponents(shipComponents) ? (
                  <ShipPanel entity={asShip(entity)} />
                ) : entity.hasComponents(facilityComponents) ? (
                  <FacilityPanel entity={asFacility(entity)} />
                ) : null}
                {entity.hasComponents(sectorComponents) && (
                  <>
                    <Resources entity={sector(entity)} />
                    <SectorResources entity={sector(entity)} />
                    <SectorPrices entity={sector(entity)} />
                  </>
                )}
                {entity.hasComponents(["storage"]) && (
                  <>
                    <Allocations
                      entity={entity.requireComponents(["storage"])}
                    />
                    <hr />
                  </>
                )}
                <Subordinates entity={entity} />
                <hr />
                {entity.hasComponents(["deployable"]) && (
                  <Undeploy
                    deployable={entity.requireComponents(["deployable"])}
                    facility={
                      entity.cp.builder?.targetId
                        ? sim.get(entity.cp.builder.targetId)
                        : undefined
                    }
                  />
                )}
              </JournalWrapper>
            </>
          ) : (
            <>
              <PlayerShips />
              <PlayerFacilities />
              {window.dev && (
                <>
                  <Inflation sim={sim} />
                  <hr />
                </>
              )}
            </>
          ))}
      </PanelComponent>
      <ConfigDialog
        open={dialog?.type === "config"}
        onClose={() => {
          closeDialog();
          sim.start();
        }}
      />
      <TradeDialog open={dialog?.type === "trade"} onClose={closeDialog} />
      <FacilityModuleManager
        open={dialog?.type === "facilityModuleManager"}
        onClose={closeDialog}
      />
      <FacilityMoneyManager
        open={dialog?.type === "facilityMoneyManager"}
        onClose={closeDialog}
      />
      <FacilityTradeManager
        open={dialog?.type === "facilityTradeManager"}
        onClose={closeDialog}
      />
    </>
  );
};
