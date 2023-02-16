import React from "react";
import { shipComponents, ship as asShip } from "@core/archetypes/ship";
import { Entity } from "@core/components/entity";
import {
  facilityComponents,
  facility as asFacility,
} from "@core/archetypes/facility";
import { sector, sectorComponents } from "@core/archetypes/sector";
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
import { useRerender } from "../../hooks/useRerender";
import { PlayerFacilities } from "../PlayerFacilities";
import { TradeDialog } from "../TradeDialog";
import { PanelComponent } from "./PanelComponent";

export interface PanelProps {
  expanded?: boolean;
  entity: Entity | undefined;
}

export const Panel: React.FC<PanelProps> = ({ entity, expanded }) => {
  const [isCollapsed, setCollapsed] = React.useState(!expanded);
  const [dialog, setDialog] = useGameDialog();
  const toggleCollapse = React.useCallback(() => setCollapsed((c) => !c), []);

  const [sim] = useSim();

  const closeDialog = React.useCallback(() => setDialog(null), []);

  useRerender(250);

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
    </>
  );
};
