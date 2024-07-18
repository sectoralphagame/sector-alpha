import { usePopper } from "react-popper";
import type { Dispatch, ReactElement, SetStateAction } from "react";
import React, { useEffect, useState } from "react";
import { Transition } from "@headlessui/react";
import styles from "./Tooltip.scss";

export interface TooltipProps {
  containerClassName?: string;
  /**
   * Element to display over which the tooltip will be shown
   */
  anchor: (_ref: Dispatch<SetStateAction<any>>) => ReactElement;
}

export const Tooltip: React.FC<React.PropsWithChildren<TooltipProps>> = ({
  anchor,
  children,
}) => {
  const [show, setShow] = useState(false);
  const [referenceElement, setReferenceElement] =
    useState<HTMLDivElement | null>();
  const [popperElement, setPopperElement] = useState<HTMLDivElement | null>();
  const { styles: popperStyles, attributes } = usePopper(
    referenceElement,
    popperElement
  );

  useEffect(() => {
    if (referenceElement) {
      referenceElement.onmouseenter = () => setShow(true);
      referenceElement.onmouseleave = () => setShow(false);
    }
  }, [referenceElement]);

  return (
    <>
      {anchor(setReferenceElement)}
      <Transition
        ref={setPopperElement}
        show={show}
        as="div"
        className={styles.container}
        enterFrom={styles.hide}
        enterTo={styles.show}
        leaveFrom={styles.show}
        leaveTo={styles.hide}
        style={popperStyles.popper}
        {...attributes.popper}
      >
        <div className={styles.tooltip}>{children}</div>
      </Transition>
    </>
  );
};
