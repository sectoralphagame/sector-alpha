import React from "react";
import SVG from "react-inlinesvg";
import clsx from "clsx";
import { shipComponents, ship as asShip } from "../../archetypes/ship";
import { Entity } from "../../components/entity";
import FacilityPanel from "./FacilityPanel";
import ffIcon from "../../../assets/ui/ff.svg";
import pauseIcon from "../../../assets/ui/pause.svg";
import locationIcon from "../../../assets/ui/location.svg";
import configIcon from "../../../assets/ui/config.svg";
import arrowLeftIcon from "../../../assets/ui/arrow_left.svg";
import playIcon from "../../../assets/ui/play.svg";
import { IconButton } from "./IconButton";
import ShipPanel from "./ShipPanel";
import { nano, theme } from "../../style";
import { ConfigDialog } from "./ConfigDialog";
import { useLayout } from "../context/Layout";
import {
  facilityComponents,
  facility as asFacility,
} from "../../archetypes/facility";
import EntityName from "./EntityName";
import Resources from "./Resources";
import { sector, sectorComponents } from "../../archetypes/sector";
import SectorResources from "./SectorStats";
import SectorPrices from "./SectorPrices";
import Inflation from "./InflationStats";
import { useSim } from "../atoms";

const styles = nano.sheet({
  iconBar: {
    display: "flex",
    gap: theme.spacing(1),
    marginBottom: theme.spacing(3),
  },
  iconBarCollapsed: {
    flexDirection: "column",
  },
  root: {
    borderRight: `1px solid ${theme.palette.default}`,
    padding: theme.spacing(3),
  },
  scrollArea: {
    "&::-webkit-scrollbar": {
      display: "none",
    },
    overflowY: "scroll",
    height: `calc(100vh - 32px - ${theme.spacing(9)})`,
    paddingBottom: theme.spacing(3),
  },
  rotate: {
    transform: "rotate(180deg)",
  },
  spacer: {
    flex: 1,
  },
});

export const Panel: React.FC = () => {
  const { isCollapsed, toggleCollapse } = useLayout();
  const [openConfig, setOpenConfig] = React.useState(false);
  const [, setRender] = React.useState(false);
  const interval = React.useRef<number>();

  const [sim] = useSim();
  const selectedId = sim.queries.settings.get()[0]!.cp.selectionManager.id;

  const [entity, setEntity] = React.useState<Entity | undefined>(
    selectedId ? sim.get(selectedId) : undefined
  );

  React.useEffect(() => {
    if (entity?.id !== selectedId) {
      setEntity(selectedId ? sim.get(selectedId) : undefined);
    }
  });

  React.useEffect(() => {
    if (entity && isCollapsed) {
      toggleCollapse();
    }
  }, [entity]);

  React.useEffect(() => {
    if (!sim) return;
    if (openConfig) {
      sim.pause();
    } else {
      sim.start();
    }
  }, [openConfig]);

  React.useEffect(() => {
    interval.current = setInterval(
      () => setRender((v) => !v),
      250
    ) as unknown as number;

    return () => clearInterval(interval.current);
  }, []);

  if (!sim) return null;

  return (
    <div className={styles.root} id="toolbar">
      <div
        className={clsx(styles.iconBar, {
          [styles.iconBarCollapsed]: isCollapsed,
        })}
      >
        {isCollapsed ? (
          <IconButton className={styles.rotate} onClick={toggleCollapse}>
            <SVG src={arrowLeftIcon} />
          </IconButton>
        ) : (
          <IconButton onClick={() => setOpenConfig(true)}>
            <SVG src={configIcon} />
          </IconButton>
        )}
        <IconButton onClick={sim?.pause}>
          <SVG src={pauseIcon} />
        </IconButton>
        <IconButton
          onClick={() => {
            sim.setSpeed(1);
            sim.start();
          }}
        >
          <SVG src={playIcon} />
        </IconButton>
        <IconButton
          onClick={() => {
            sim.setSpeed(10);
            sim.start();
          }}
        >
          <SVG src={ffIcon} />
        </IconButton>
        {!!entity && (
          <IconButton
            onClick={() => {
              sim.find((e) =>
                e.hasComponents(["selectionManager"])
              )!.cp.selectionManager!.focused = true;
            }}
          >
            <SVG src={locationIcon} />
          </IconButton>
        )}
        {!isCollapsed ? (
          <>
            <div className={styles.spacer} />
            <IconButton onClick={toggleCollapse}>
              <SVG src={arrowLeftIcon} />
            </IconButton>
          </>
        ) : (
          <IconButton onClick={() => setOpenConfig(true)}>
            <SVG src={configIcon} />
          </IconButton>
        )}
      </div>
      {!isCollapsed &&
        (entity ? (
          <div className={styles.scrollArea}>
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
          </div>
        ) : (
          <Inflation sim={sim} />
        ))}
      <ConfigDialog open={openConfig} onClose={() => setOpenConfig(false)} />
    </div>
  );
};
