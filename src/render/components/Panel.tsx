import React from "react";
import ReactDOM from "react-dom";
import { Ship } from "../../entities/ship";
import FacilityPanel from "./FacilityPanel";
import ShipPanel from "./ShipPanel";

const Panel: React.FC = () => {
  const [, setRender] = React.useState(false);
  const interval = React.useRef<number>();

  React.useEffect(() => {
    interval.current = setInterval(
      () => setRender((v) => !v),
      500
    ) as unknown as number;

    return () => clearInterval(interval.current);
  }, []);

  return (
    <div>
      <button onClick={window.sim.pause} type="button">
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

      {window.selected ? (
        window.selected instanceof Ship ? (
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