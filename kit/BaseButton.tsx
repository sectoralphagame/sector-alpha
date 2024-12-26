import React from "react";
import { Howl } from "howler";
import click from "@assets/ui/sounds/click.wav";
import pop from "@assets/ui/sounds/pop.wav";
import { useGameSettings } from "@ui/hooks/useGameSettings";

export type BaseButtonProps = React.DetailedHTMLProps<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  HTMLButtonElement
> & {
  clickSound?: Howl;
  enterSound?: Howl;
};

export const defaultClickSound = new Howl({
  src: click,
  volume: 0.2,
});

export const popSound = new Howl({
  src: pop,
  volume: 0.2,
});

export const BaseButton: React.FC<BaseButtonProps> = ({
  onClick,
  onMouseEnter,
  clickSound,
  enterSound,
  ...props
}) => {
  const [settings] = useGameSettings();
  const ref = React.useRef<HTMLButtonElement>(null);

  return (
    <button
      type="button"
      {...props}
      ref={ref}
      onClick={(event) => {
        const sound = clickSound ?? defaultClickSound;
        sound.volume(settings.volume.ui);

        sound.play();
        if (onClick) {
          onClick(event);
        }
      }}
      onMouseEnter={(event) => {
        const sound = enterSound ?? popSound;
        sound.volume(settings.volume.ui);
        sound.play();
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
