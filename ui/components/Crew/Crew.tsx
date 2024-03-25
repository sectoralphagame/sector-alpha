import React from "react";
import type { RequirePureComponent } from "@core/tsHelpers";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleSummary,
} from "@kit/Collapsible";
import clsx from "clsx";
import { Tooltip } from "@kit/Tooltip";
import Text from "@kit/Text";
import { getCrewMultiplier, getMoodMultiplier } from "@core/systems/producing";
import { sum } from "@fxts/core";
import {
  ArrowDownFatIcon,
  ArrowUpFatIcon,
  ExclamationIcon,
  SmileyIcon,
  SmileyMehIcon,
  SmileySadIcon,
} from "@assets/ui/icons";
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
        <SmileyIcon
          innerRef={ref!}
          className={styles.icon}
          style={{ color: "var(--palette-success)" }}
        />
      );
    }

    if (mood < 30) {
      return (
        <SmileySadIcon
          innerRef={ref}
          className={styles.icon}
          style={{ color: "var(--palette-error)" }}
        />
      );
    }

    return (
      <SmileyMehIcon
        innerRef={ref}
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
                <ExclamationIcon
                  innerRef={ref}
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
            <ArrowUpFatIcon
              className={clsx(styles.icon, styles.growth, styles.positive)}
            />
          )}
          {growth === "negative" && (
            <ArrowDownFatIcon
              className={clsx(styles.icon, styles.growth, styles.negative)}
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
