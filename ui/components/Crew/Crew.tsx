import React from "react";
import type { RequirePureComponent } from "@core/tsHelpers";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleSummary,
} from "@kit/Collapsible";
import smiley from "@assets/ui/smiley.svg";
import sadSmiley from "@assets/ui/smiley_sad.svg";
import mehSmiley from "@assets/ui/smiley_meh.svg";
import exclamation from "@assets/ui/exclamation.svg";
import SVG from "react-inlinesvg";
import clsx from "clsx";
import { Tooltip } from "@kit/Tooltip";
import Text from "@kit/Text";
import { getCrewMultiplier, getMoodMultiplier } from "@core/systems/producing";
import { sum } from "@fxts/core";
import arrowUpFatIcon from "@assets/ui/arrow_up_fat.svg";
import arrowDownFatIcon from "@assets/ui/arrow_down_fat.svg";
import styles from "./styles.scss";

export interface CrewProps {
  entity: RequirePureComponent<"crew">;
  growth: "positive" | "negative" | "neutral";
  requiredCrew: number | null;
}

const Smiley = React.forwardRef<SVGAElement, { mood: number }>(
  ({ mood }, ref) => {
    if (mood > 70) {
      return (
        <SVG
          innerRef={ref!}
          src={smiley}
          className={styles.icon}
          style={{ color: "var(--palette-success)" }}
        />
      );
    }

    if (mood < 30) {
      return (
        <SVG
          innerRef={ref}
          src={sadSmiley}
          className={styles.icon}
          style={{ color: "var(--palette-error)" }}
        />
      );
    }

    return (
      <SVG
        innerRef={ref}
        src={mehSmiley}
        className={styles.icon}
        style={{ color: "var(--palette-warning)" }}
      />
    );
  }
);

export const Crew: React.FC<CrewProps> = ({ entity, requiredCrew, growth }) => (
  <>
    <Collapsible defaultOpen>
      <CollapsibleSummary className={styles.summary}>
        Crew
        <Tooltip
          anchor={
            // eslint-disable-next-line react/no-unstable-nested-components
            (ref) => <Smiley ref={ref} mood={entity.cp.crew.mood} />
          }
        >
          <Text component="p" variant="caption">
            Your crew&apos;s happiness level is{" "}
            {Math.floor(entity.cp.crew.mood)}
            %.
          </Text>
          <Text component="p" variant="caption">
            Keep your crew happy to increase productivity. <br />
            You can achieve this by providing them with enough resources and
            building specialized modules, like Casino.
          </Text>
        </Tooltip>
        {requiredCrew !== null && requiredCrew > entity.cp.crew.workers.max && (
          <Tooltip
            anchor={
              // eslint-disable-next-line react/no-unstable-nested-components
              (ref) => (
                <SVG
                  innerRef={ref}
                  src={exclamation}
                  className={clsx(styles.icon, styles.warning)}
                />
              )
            }
          >
            <Text component="p" variant="caption">
              Not enough space for workers.
            </Text>
            <Text component="p" variant="caption">
              Need at least {requiredCrew}.
              <br />
              Add more space by building new habitats.
            </Text>
          </Tooltip>
        )}
      </CollapsibleSummary>
      <CollapsibleContent>
        <Text component="p">
          Current {Math.floor(entity.cp.crew.workers.current)} /{" "}
          {entity.cp.crew.workers.max} Max
          {growth === "positive" && (
            <SVG
              className={clsx(styles.icon, styles.growth, styles.positive)}
              src={arrowUpFatIcon}
            />
          )}
          {growth === "negative" && (
            <SVG
              className={clsx(styles.icon, styles.growth, styles.negative)}
              src={arrowDownFatIcon}
            />
          )}
        </Text>
        {requiredCrew !== null && (
          <Text component="p">
            Crew is working at{" "}
            {Math.max(
              0,
              Math.floor(
                sum([
                  getCrewMultiplier(
                    requiredCrew,
                    entity.cp.crew.workers.current
                  ),
                  getMoodMultiplier(entity.cp.crew.mood),
                ]) * 100
              )
            )}
            % efficiency.
          </Text>
        )}
      </CollapsibleContent>
    </Collapsible>
    <hr />
  </>
);
