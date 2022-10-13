import clsx from "clsx";
import React from "react";
import { nano } from "../ui/style";

const styles = nano.sheet({
  root: {
    "&:hover, &:focus": {
      background: "rgba(255, 255, 255, 0.15)",
    },
    "&:active": {
      background: "rgba(255, 255, 255, 0.3)",
    },
    appearance: "none",
    background: "var(--palette-background)",
    borderRadius: "4px",
    border: "1px solid var(--palette-default)",
    color: "var(--palette-default)",
    height: "32px",
    padding: "var(--spacing-1)",
    lineHeight: 1,
    fontSize: "var(--typography-button)",
    fontWeight: 600,
    transition: "200ms",
    outline: 0,
  },
  label: {
    cursor: "pointer",
    fontSize: "var(--typography-label)",
    marginLeft: "var(--spacing-0-5)",
  },
});

export const Input = React.forwardRef<
  HTMLInputElement,
  React.DetailedHTMLProps<
    React.InputHTMLAttributes<HTMLInputElement>,
    HTMLInputElement
  >
>((props, ref) => (
  <input
    {...props}
    ref={ref}
    // eslint-disable-next-line react/destructuring-assignment
    className={clsx(styles.root, props?.className)}
  />
));
Input.displayName = "Input";

export const LabeledInput = React.forwardRef<
  HTMLInputElement,
  React.DetailedHTMLProps<
    React.InputHTMLAttributes<HTMLInputElement>,
    HTMLInputElement
  > & { label: string }
>(({ id, label, ...props }, ref) => (
  <div>
    <label className={styles.label} htmlFor={id}>
      {label}
    </label>
    <Input {...props} ref={ref} />
  </div>
));
LabeledInput.displayName = "LabeledInput";
