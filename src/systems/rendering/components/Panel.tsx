import React from "react";
import ReactDOM from "react-dom";
import SVG from "react-inlinesvg";
import { shipComponents } from "../../../archetypes/ship";
import { Entity } from "../../../components/entity";
import FacilityPanel from "./FacilityPanel";
import ffIcon from "../../../../assets/ui/ff.svg";
import pauseIcon from "../../../../assets/ui/pause.svg";
import locationIcon from "../../../../assets/ui/location.svg";
import configIcon from "../../../../assets/ui/config.svg";
import playIcon from "../../../../assets/ui/play.svg";
import { IconButton } from "./IconButton";
import ShipPanel from "./ShipPanel";
import { nano } from "../../../style";
import { ConfigDialog } from "./ConfigDialog";
import { Button } from "./Button";

const styles = nano.sheet({
  root: {
    display: "grid",
    gridTemplateColumns: "450px 1fr",
  },
  iconBar: {
    display: "flex",
    gap: "8px",
    marginBottom: "24px",
  },
  toolbar: {
    borderRight: "1px solid #fff",
    padding: "24px",
  },
});

const Panel: React.FC = () => {
  const [openConfig, setOpenConfig] = React.useState(false);
  const [, setRender] = React.useState(false);
  const interval = React.useRef<number>();
  const root = React.useRef(document.querySelector<HTMLDivElement>("#root")!);
  const toolbar = React.useRef(
    document.querySelector<HTMLDivElement>("#toolbar")!
  );

  React.useEffect(() => {
    if (!window.sim) return;
    if (openConfig) {
      window.sim.pause();
    } else {
      window.sim.start();
    }
  }, [openConfig]);

  React.useEffect(() => {
    root.current.className = styles.root;
    toolbar.current.className = styles.toolbar;
  }, []);

  React.useEffect(() => {
    interval.current = setInterval(
      () => setRender((v) => !v),
      250
    ) as unknown as number;

    return () => clearInterval(interval.current);
  }, []);

  return (
    <div>
      <div className={styles.iconBar}>
        <IconButton onClick={() => setOpenConfig(true)}>
          <SVG src={configIcon} />
        </IconButton>
        <IconButton onClick={window.sim?.pause}>
          <SVG src={pauseIcon} />
        </IconButton>
        <IconButton
          onClick={() => {
            window.sim.setSpeed(1);
            window.sim.start();
          }}
        >
          <SVG src={playIcon} />
        </IconButton>
        <IconButton
          onClick={() => {
            window.sim.setSpeed(10);
            window.sim.start();
          }}
        >
          <SVG src={ffIcon} />
        </IconButton>
        {!!window.selected && (
          <IconButton
            onClick={() => {
              window.sim.find((e) =>
                e.hasComponents(["selectionManager"])
              ).cp.selectionManager.focused = true;
            }}
          >
            <SVG src={locationIcon} />
          </IconButton>
        )}
      </div>
      {window.selected ? (
        (window.selected as Entity).hasComponents(shipComponents) ? (
          <ShipPanel />
        ) : (
          <FacilityPanel />
        )
      ) : (
        <div />
      )}
      <ConfigDialog open={openConfig} onClose={() => setOpenConfig(false)}>
        <Button>load</Button>
        <Button>save</Button>
      </ConfigDialog>
    </div>
  );
};

ReactDOM.render(<Panel />, document.querySelector("#toolbar"));
