import React from "react";
import Modal from "react-modal";
import SVG from "react-inlinesvg";
import { IconButton } from "./IconButton";
import closeIcon from "../../../../assets/ui/close.svg";
import { nano } from "../../../style";

Modal.setAppElement("#root");

export interface DialogProps {
  open: boolean;
  title?: string;
  onClose: () => void;
}

const styles = nano.sheet({
  title: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "24px",
  },
  titleText: {
    fontSize: "27px",
    margin: 0,
  },
});

export const Dialog: React.FC<DialogProps> = ({
  children,
  title,
  open,
  onClose,
}) => (
  <Modal
    isOpen={open}
    onRequestClose={onClose}
    style={{
      content: {
        backgroundColor: "rgb(0 0 0 / 85%)",
        top: "50%",
        left: "50%",
        right: "auto",
        bottom: "auto",
        width: "300px",
        marginRight: "-50%",
        transform: "translate(-50%, -50%)",
      },
      overlay: {
        backgroundColor: "rgb(0 0 0 / 85%)",
      },
    }}
  >
    <div className={styles.title}>
      <h3 className={styles.titleText}>{title}</h3>
      <IconButton onClick={onClose}>
        <SVG src={closeIcon} />
      </IconButton>
    </div>
    {children}
  </Modal>
);
Dialog.displayName = "Dialog";
