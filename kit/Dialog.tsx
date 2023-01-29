import React from "react";
import Modal from "react-modal";
import SVG from "react-inlinesvg";
import closeIcon from "@assets/ui/close.svg";
import { IconButton } from "./IconButton";
import Text from "./Text";
import styles from "./Dialog.scss";

try {
  Modal.setAppElement("#root");
} catch {}

export interface DialogProps {
  open: boolean;
  title?: string;
  width?: string;
  onClose: () => void;
}

export const Dialog: React.FC<DialogProps> = ({
  children,
  title,
  open,
  width,
  onClose,
}) => (
  <Modal
    isOpen={open}
    onRequestClose={onClose}
    style={{
      content: {
        backgroundColor: "rgb(0 0 0)",
        top: "50%",
        left: "50%",
        right: "auto",
        bottom: "auto",
        maxWidth: `calc(100vw - ${"var(--spacing-4)"})`,
        width: width ?? "300px",
        marginRight: "-50%",
        transform: "translate(-50%, -50%)",
      },
      overlay: {
        backgroundColor: "rgb(0 0 0 / 85%)",
      },
    }}
  >
    <div className={styles.title}>
      <Text className={styles.titleText} variant="h1">
        {title}
      </Text>
      <IconButton onClick={onClose}>
        <SVG src={closeIcon} />
      </IconButton>
    </div>
    {children}
  </Modal>
);
Dialog.displayName = "Dialog";
