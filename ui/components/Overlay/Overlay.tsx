import { Button } from "@kit/Button";
import type { DialogProps } from "@kit/Dialog";
import Text from "@kit/Text";
import clsx from "clsx";
import React from "react";
import styles from "./Overlay.scss";

export interface OverlayProps extends DialogProps {
  title: string;
}

export const Overlay: React.FC<OverlayProps> = ({
  open,
  title,
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
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions
    <div
      className={clsx(styles.root, {
        [styles.active]: open,
        [styles.closing]: closing,
      })}
      id="overlay"
    >
      {open ? (
        <>
          <div className={styles.bar}>
            <Button type="button" onClick={close}>
              Back
            </Button>
            <Text variant="h1" color="primary">
              {title}
            </Text>
          </div>
          <div>{children}</div>
        </>
      ) : null}
    </div>
  );
};
