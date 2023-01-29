import { useCallback, useEffect, useState } from "react";

const exitFullscreen = (): Promise<void> => {
  if (document.exitFullscreen) {
    document.exitFullscreen();
  } else if ((document as any).webkitExitFullscreen) {
    (document as any).webkitExitFullscreen();
  }

  return Promise.resolve();
};

const getFullscreenElement = (): Element | null => {
  if (document.fullscreenElement !== undefined) {
    return document.fullscreenElement;
  }
  if ((document as any).webkitFullscreenElement) {
    return (document as any).webkitFullscreenElement;
  }

  return null;
};

const goFullscreen = (): Promise<void> => {
  if (document.documentElement.requestFullscreen) {
    document.documentElement.requestFullscreen();
  } else if ((document.documentElement as any).webkitRequestFullscreen) {
    (document.documentElement as any).webkitRequestFullscreen();
  }

  return Promise.resolve();
};

function useFullscreen() {
  const [fullscreen, setFullscreen] = useState(!!getFullscreenElement());

  useEffect(() => {
    const handler = () => setFullscreen(!!getFullscreenElement());
    document.addEventListener("fullscreenchange", handler);
    document.addEventListener("webkitfullscreenchange", handler);

    return () => {
      document.removeEventListener("fullscreenchange", handler);
      document.addEventListener("webkitfullscreenchange", handler);
    };
  }, []);

  const toggle = useCallback(() => {
    if (getFullscreenElement()) {
      exitFullscreen();
    } else {
      goFullscreen();
    }
  }, []);

  return { fullscreenEnabled: fullscreen, toggle };
}

export default useFullscreen;
