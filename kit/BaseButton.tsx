import React from "react";
import { useGameSettings } from "@ui/hooks/useGameSettings";
import type { Howl } from "howler";
import sounds from "@assets/ui/sounds";

export type BaseButtonProps = Omit<
  React.DetailedHTMLProps<
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    HTMLButtonElement
  >,
  "ref"
> & {
  clickSound?: Howl;
  enterSound?: Howl;
};

export const BaseButton = React.forwardRef<HTMLButtonElement, BaseButtonProps>(
  (
    { onClick, onMouseEnter, clickSound: clickSoundProp, enterSound, ...props },
    ref
  ) => {
    const [settings] = useGameSettings();

    return (
      <button
        type="button"
        {...props}
        ref={ref}
        onClick={(event) => {
          const sound = clickSoundProp ?? sounds.click;
          sound.volume(settings.volume.ui);
          sound.play();

          onClick?.(event);
        }}
        onMouseEnter={(event) => {
          const sound = enterSound ?? sounds.pop;
          sound.volume(settings.volume.ui);
          sound.play();

          if (onMouseEnter) {
            onMouseEnter(event);
          }
        }}
      />
    );
  }
);
BaseButton.displayName = "BaseButton";
