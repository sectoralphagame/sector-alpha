import { Button } from "@kit/Button";
import type { DialogProps } from "@kit/Dialog";
import Text from "@kit/Text";
import type { GameOverlayProps } from "@ui/atoms";
import { useGameOverlay } from "@ui/atoms";
import clsx from "clsx";
import React from "react";
import uniq from "lodash/uniq";
import styles from "./Overlay.scss";

const OverlayContext = React.createContext<(_name: GameOverlayProps) => void>(
  () => undefined
);

export const useOverlayRegister = (slug: GameOverlayProps) => {
  const register = React.useContext(OverlayContext);
  React.useEffect(() => {
    register(slug);
  }, []);
};

export interface OverlayProps extends DialogProps {
  active: string | null;
}

const overlayNames: Record<NonNullable<GameOverlayProps>, string> = {
  fleet: "Fleet Management",
  missions: "Active Missions",
  map: "Strategic Map",
  dev: "Developer Tools",
};

export const Overlay: React.FC<OverlayProps> = ({
  open,
  active,
  onClose,
  children,
}) => {
  const [overlays, setOverlays] = React.useState<GameOverlayProps[]>([]);
  const [, setOverlay] = useGameOverlay();
  const register = React.useCallback(
    (name: GameOverlayProps) => setOverlays((prev) => uniq([...prev, name])),
    []
  );

  return (
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions
    <OverlayContext.Provider value={register}>
      <div
        className={clsx(styles.root, {
          [styles.active]: open,
        })}
        id="overlay"
      >
        {open ? (
          <>
            <div className={styles.bar}>
              <Button type="button" onClick={onClose}>
                Back
              </Button>
              {overlays.map((slug) => (
                <Text
                  variant="h3"
                  color={active === slug ? "primary" : "default"}
                  onClick={() => setOverlay(slug)}
                  key={slug}
                >
                  {overlayNames[slug ?? ""]}
                </Text>
              ))}
            </div>
            <div>{children}</div>
          </>
        ) : (
          children
        )}
      </div>
    </OverlayContext.Provider>
  );
};
