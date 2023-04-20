import React from "react";
import type { Mission } from "@core/components/missions";
import Text from "@kit/Text";
import { isMoneyReward, isRelationReward } from "@core/systems/mission/rewards";
import { Button } from "@kit/Button";
import clsx from "clsx";
import styles from "./MissionsOverlay.scss";

export interface MissionsOverlayComponentProps {
  missions: Mission[];
  onMissionCancel: (_missionIndex: number) => void;
}

export const MissionsOverlayComponent: React.FC<
  MissionsOverlayComponentProps
> = ({ missions, onMissionCancel }) => {
  const [selected, setSelected] = React.useState(0);

  return (
    <div>
      <h1>Your Missions</h1>
      <div className={styles.grid}>
        <div>
          {missions.length === 0
            ? "You currently have no missions active"
            : missions.map((m, mIndex) => (
                <Text
                  className={clsx(styles.missionLink, {
                    [styles.missionLinkActive]: mIndex === selected,
                  })}
                  onClick={() => setSelected(mIndex)}
                  key={m.title + mIndex}
                >
                  {m.title}
                </Text>
              ))}
        </div>
        {missions.length > 0 && (
          <div>
            <Text variant="h3">{missions[selected].title}</Text>
            <Text>{missions[selected].description}</Text>
            <hr className={styles.divider} />
            <div className={styles.rewards}>
              <div>
                {missions[selected].rewards.map((reward, rewardIndex) => (
                  <div key={reward.type + rewardIndex}>
                    {isMoneyReward(reward)
                      ? `${reward.amount} UTT`
                      : isRelationReward(reward)
                      ? "Reputation"
                      : null}
                  </div>
                ))}
              </div>
              <Button
                onClick={() => {
                  if (selected > 0) {
                    setSelected(selected - 1);
                  }
                  onMissionCancel(selected);
                }}
              >
                Cancel mission
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
