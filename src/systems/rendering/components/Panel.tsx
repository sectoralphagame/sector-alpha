import React from "react";
import ReactDOM from "react-dom";
import { shipComponents } from "../../../archetypes/ship";
import { Entity } from "../../../components/entity";
import FacilityPanel from "./FacilityPanel";
import ShipPanel from "./ShipPanel";

const Panel: React.FC = () => {
  const [, setRender] = React.useState(false);
  const interval = React.useRef<number>();

  React.useEffect(() => {
    interval.current = setInterval(
      () => setRender((v) => !v),
      250
    ) as unknown as number;

    return () => clearInterval(interval.current);
  }, []);

  return (
    <div>
      <button onClick={window.sim?.pause} type="button">
        pause
      </button>
      <button
        onClick={() => {
          window.sim.setSpeed(1);
          window.sim.start();
        }}
        type="button"
      >
        start
      </button>
      <button
        onClick={() => {
          window.sim.setSpeed(4);
          window.sim.start();
        }}
        type="button"
      >
        x4
      </button>
      <button
        onClick={() => {
          window.sim.setSpeed(10);
          window.sim.start();
        }}
        type="button"
      >
        x10
      </button>
      {!!window.selected && (
        <button
          onClick={() => {
            window.sim.entities.find((e) =>
              e.hasComponents(["selectionManager"])
            ).cp.selectionManager.focused = true;
          }}
          type="button"
        >
          focus
        </button>
      )}

      {window.selected ? (
        (window.selected as Entity).hasComponents(shipComponents) ? (
          <ShipPanel />
        ) : (
          <FacilityPanel />
        )
      ) : (
        <div />
      )}
    </div>
  );
};

ReactDOM.render(<Panel />, document.querySelector("#toolbar"));
