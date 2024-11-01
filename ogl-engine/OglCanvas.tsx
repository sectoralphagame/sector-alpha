import React from "react";

import styles from "./styles.scss";
import type { OGLCallback } from "./useOgl";
import { useOgl } from "./useOgl";

export interface OglCanvasProps {
  onInit: OGLCallback;
  onUpdate: OGLCallback;
}

export const OglCanvas: React.FC<OglCanvasProps> = React.memo((props) => {
  const { setCanvas, fps, fpsCounterEnabled } = useOgl(props);

  return (
    <>
      <canvas
        ref={setCanvas}
        onContextMenu={(event) => {
          event.preventDefault();
        }}
      />
      {fpsCounterEnabled && <div className={styles.fps}>{fps}</div>}
    </>
  );
});
