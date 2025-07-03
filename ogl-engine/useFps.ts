import { actionLoader } from "@core/actionLoader";
import { isDev } from "@core/settings";
import { useEffect, useState } from "react";

export function useFps(register?: boolean) {
  const [fps, setFps] = useState(0);
  const [frameTime, setFrameTime] = useState(0);
  const [enabled, setEnabled] = useState(isDev);

  useEffect(() => {
    if (register) {
      actionLoader.register(
        {
          category: "drawing",
          description: "Toggle FPS counter",
          slug: "fps",
          fn: () => setEnabled((v) => !v),
          name: "FPS Counter",
          type: "basic",
        },
        "OglCanvas"
      );
    }

    const ticker = setInterval(() => {
      setFps(window.renderer.performance.getFps());
      setFrameTime(window.renderer.performance.getAverageFrameTime());
    }, 1000) as unknown as number;

    return () => {
      clearInterval(ticker);
    };
  }, []);

  return {
    fps,
    frameTime,
    enabled,
  };
}
