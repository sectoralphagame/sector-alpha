import { frameData } from "@core/systems/reporting/avgFrameReporting";
import { useObservable } from "@ui/hooks/useObservable";
import React from "react";
import { useGameSettings } from "@ui/hooks/useGameSettings";
import { SimAvgTimeGraphComponent } from "./SimAvgTimeGraphComponent";
import styles from "./styles.scss";

const SimAvgTimeGraph: React.FC = () => {
  const [data] = useObservable(frameData);
  const [settings] = useGameSettings();

  if (data.length === 0) return null;

  return (
    <div className={styles.root}>
      <SimAvgTimeGraphComponent
        data={data}
        height={200}
        width={600}
        scale={settings.scale / 10}
      />
    </div>
  );
};

export default SimAvgTimeGraph;
