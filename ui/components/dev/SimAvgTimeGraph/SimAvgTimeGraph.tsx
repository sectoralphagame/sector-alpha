import { frameData } from "@core/systems/reporting/avgFrameReporting";
import { useObservable } from "@ui/hooks/useObservable";
import React from "react";
import { SimAvgTimeGraphComponent } from "./SimAvgTimeGraphComponent";
import styles from "./styles.scss";

const SimAvgTimeGraph: React.FC = () => {
  const [data] = useObservable(frameData);

  return (
    <div className={styles.root}>
      {data.length > 0 && (
        <SimAvgTimeGraphComponent data={data} height={100} width={300} />
      )}
    </div>
  );
};

export default SimAvgTimeGraph;
