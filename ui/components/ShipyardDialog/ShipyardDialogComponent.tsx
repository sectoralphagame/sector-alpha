import type { Blueprints } from "@core/components/blueprints";
import { commodityLabel } from "@core/economy/commodity";
import { Button } from "@kit/Button";
import { Dialog } from "@kit/Dialog";
import { IconButton } from "@kit/IconButton";
import { Input } from "@kit/Input";
import Text from "@kit/Text";
import clsx from "clsx";
import { sum } from "mathjs";
import React from "react";
import SVG from "react-inlinesvg";
import closeIcon from "@assets/ui/close.svg";
import type { ModalProps } from "../ConfigDialog";
import styles from "./ShipyardDialog.scss";

export interface ShipyardDialogComponentProps extends ModalProps {
  blueprints: Array<Blueprints["ships"][number] & { cost: number }>;
  money: number;
  showCommodityCost: boolean;
  onBuild: (
    _bp: Array<Blueprints["ships"][number] & { cost: number; quantity: number }>
  ) => void;
}

const ModuleItem: React.FC<{ onClick: () => void; isActive: boolean }> = ({
  children,
  onClick,
  isActive,
}) => (
  <Button
    className={clsx(styles.blueprintsItem, {
      [styles.blueprintsItemActive]: isActive,
    })}
    type="button"
    onClick={onClick}
  >
    {children}
  </Button>
);

export const ShipyardDialogComponent: React.FC<
  ShipyardDialogComponentProps
> = ({ blueprints, money, showCommodityCost, onBuild, open, onClose }) => {
  const [activeBlueprint, setActiveBlueprint] = React.useState<string>();
  const [queue, setQueue] = React.useState<
    Array<
      ShipyardDialogComponentProps["blueprints"][number] & { quantity: number }
    >
  >([]);
  const selectedBlueprint = blueprints.find(
    (bp) => bp.slug === activeBlueprint
  );
  const totalCost: number = sum(queue.map((bp) => bp.quantity * bp.cost));

  return (
    <Dialog title="Buy ships" open={open} onClose={onClose} width="800px">
      <div className={styles.root}>
        <div>
          <h4 className={styles.sectionHeader}>Available ships</h4>
          <div className={styles.blueprints}>
            {blueprints.map((bp) => (
              <ModuleItem
                isActive={bp.slug === activeBlueprint}
                onClick={() => setActiveBlueprint(bp.slug)}
              >
                {bp.name}
                {!showCommodityCost && (
                  <>
                    <br />
                    <Text color="disabled" variant="caption">
                      {bp.cost} UTT
                    </Text>
                  </>
                )}
              </ModuleItem>
            ))}
          </div>
        </div>
        <div className={styles.build}>
          {selectedBlueprint && (
            <>
              <h4 className={styles.sectionHeader}>{selectedBlueprint.name}</h4>
              <div className={styles.buildContainer}>
                <div>
                  <div className={styles.buildCost}>
                    {showCommodityCost &&
                      Object.entries(selectedBlueprint.build.cost).map(
                        ([commodity, quantity]) => (
                          <div>
                            {commodityLabel[commodity]} <b>x {quantity}</b>
                          </div>
                        )
                      )}
                  </div>
                  <div className={styles.buildTime}>
                    Build time: <span>{selectedBlueprint.build.time}s</span>
                  </div>
                </div>
                <Button
                  disabled={
                    money < totalCost + selectedBlueprint.cost &&
                    !showCommodityCost
                  }
                  onClick={() =>
                    setQueue((prevQueue) => [
                      ...prevQueue,
                      { ...selectedBlueprint, quantity: 1 },
                    ])
                  }
                >
                  Add to cart
                </Button>
              </div>
            </>
          )}
        </div>
        <div>
          <h4 className={styles.sectionHeader}>Order</h4>
          <div className={styles.order}>
            <div className={styles.queue}>
              {queue.map((item, itemIndex) => (
                <div className={styles.queueItem}>
                  <span>{item.name}</span>
                  <div>
                    <Input
                      className={styles.input}
                      type="number"
                      min="1"
                      step="1"
                      value={item.quantity}
                      onChange={(event) =>
                        setQueue((p) =>
                          p.map((i, iIndex) =>
                            iIndex === itemIndex
                              ? { ...i, quantity: Number(event.target.value) }
                              : i
                          )
                        )
                      }
                    />
                    <IconButton
                      className={styles.queueItemRemove}
                      variant="naked"
                      onClick={() =>
                        setQueue((p) =>
                          p.filter((_, index) => index !== itemIndex)
                        )
                      }
                    >
                      <SVG src={closeIcon} />
                    </IconButton>
                  </div>
                </div>
              ))}
            </div>
            <div>
              {!showCommodityCost && (
                <div className={styles.buildTotal}>Total: {totalCost}</div>
              )}
              <Button
                className={styles.queueAccept}
                disabled={
                  (!showCommodityCost && money < totalCost) ||
                  queue.length === 0
                }
                onClick={() => onBuild(queue)}
              >
                Build
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Dialog>
  );
};
ShipyardDialogComponent.displayName = "ShipyardDialogComponent";
