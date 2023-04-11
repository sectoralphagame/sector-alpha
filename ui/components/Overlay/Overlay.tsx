import { Button } from "@kit/Button";
import type { DialogProps } from "@kit/Dialog";
import clsx from "clsx";
import React from "react";
import styles from "./Overlay.scss";

export interface OverlayProps extends DialogProps {}

export const Overlay: React.FC<OverlayProps> = ({
  open,
  onClose,
  children,
}) => {
  const [closing, setClosing] = React.useState(false);
  const close = () => {
    setClosing(true);
    setTimeout(() => {
      setClosing(false);
      onClose();
    }, 200);
  };

  return (
    <div
      className={clsx(styles.root, {
        [styles.active]: open,
        [styles.closing]: closing,
      })}
    >
      {open ? (
        <>
          <div>
            <Button type="button" onClick={close}>
              Back
            </Button>
          </div>
          <div>{children}</div>
        </>
      ) : null}
    </div>
  );
};
