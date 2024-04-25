import React from "react";
import { Howl } from "howler";
import click from "@assets/ui/sounds/click.wav";
import pop from "@assets/ui/sounds/pop.wav";

export type BaseButtonProps = React.DetailedHTMLProps<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  HTMLButtonElement
> & {
  clickSound?: Howl;
  enterSound?: Howl;
};

export const defaultClickSound = new Howl({
  src: click,
  volume: 0.5,
});

export const popSound = new Howl({
  src: pop,
  volume: 0.5,
});

export const BaseButton: React.FC<BaseButtonProps> = ({
  onClick,
  onMouseEnter,
  clickSound,
  enterSound,
  ...props
}) => {
  const ref = React.useRef<HTMLButtonElement>(null);

  return (
    <button
      type="button"
      {...props}
      ref={ref}
      onClick={(event) => {
        (clickSound ?? defaultClickSound).play();
        if (onClick) {
          onClick(event);
        }
      }}
      onMouseEnter={(event) => {
        (enterSound ?? popSound).play();
        if (onMouseEnter) {
          onMouseEnter(event);
        }
      }}
      onMouseUp={() => {
        ref.current?.blur();
      }}
    />
  );
};
BaseButton.displayName = "BaseButton";
