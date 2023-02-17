import type { Blueprints } from "@core/components/blueprints";
import type { FacilityModuleQueue } from "@core/components/facilityModuleQueue";
import { commodityLabel } from "@core/economy/commodity";
import type { RequireComponent } from "@core/tsHelpers";
import { Button } from "@kit/Button";
import { Dialog } from "@kit/Dialog";
import clsx from "clsx";
import React from "react";
import type { ModalProps } from "../ConfigDialog";
import styles from "./FacilityModuleManager.scss";

interface FacilityModuleManagerComponentProps extends ModalProps {
  blueprints: Blueprints["facilityModules"];
  facilityModules: RequireComponent<"name">[];
  queue: FacilityModuleQueue;
  onBuild: (_bp: Blueprints["facilityModules"][number]) => void;
  onQueueCancel: (_number: number) => void;
  onBuiltCancel: () => void;
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

export const FacilityModuleManagerComponent: React.FC<
  FacilityModuleManagerComponentProps
> = ({
  onClose,
  open,
  blueprints,
  queue,
  facilityModules,
  onBuild,
  onQueueCancel,
  onBuiltCancel,
}) => {
  const [activeModule, setActiveModule] = React.useState<
    | { type: "blueprint"; slug: string }
    | { type: "queue" | "existing"; index: number }
    | { type: "built" }
  >();
  const selectedBlueprint = blueprints.find(
    (bp) => activeModule?.type === "blueprint" && bp.slug === activeModule?.slug
  );
  const selectedQueueItem =
    activeModule?.type === "queue"
      ? queue.queue[activeModule.index]
      : activeModule?.type === "built"
      ? queue.building
      : null;

  return (
    <Dialog
      width="800px"
      open={open}
      onClose={onClose}
      title="Manage facility modules"
    >
      <div className={styles.root}>
        <div>
          <h4 className={styles.sectionHeader}>Available modules</h4>
          <div className={styles.blueprints}>
            {blueprints.map((bp) => (
              <ModuleItem
                isActive={
                  activeModule?.type === "blueprint" &&
                  bp.slug === activeModule.slug
                }
                onClick={() =>
                  setActiveModule({ type: "blueprint", slug: bp.slug })
                }
              >
                {bp.name}
              </ModuleItem>
            ))}
          </div>
        </div>
        <div className={styles.build}>
          {selectedBlueprint && (
            <>
              <h4 className={styles.sectionHeader}>{selectedBlueprint.name}</h4>
              <div className={styles.buildCost}>
                {Object.entries(selectedBlueprint.build.cost).map(
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
              <Button
                className={styles.buildBtn}
                onClick={() => onBuild(selectedBlueprint)}
              >
                Build
              </Button>
            </>
          )}
          {(activeModule?.type === "queue" || activeModule?.type === "built") &&
            selectedQueueItem && (
              <>
                <h4 className={styles.sectionHeader}>
                  {selectedQueueItem.blueprint.name}
                </h4>
                <div className={styles.buildCost}>
                  {Object.entries(selectedQueueItem.blueprint.build.cost).map(
                    ([commodity, quantity]) => (
                      <div>
                        {commodityLabel[commodity]} <b>x {quantity}</b>
                      </div>
                    )
                  )}
                </div>
                <div className={styles.buildTime}>
                  Build time:{" "}
                  <span>{selectedQueueItem.blueprint.build.time}s</span>
                </div>
                <Button
                  className={clsx(styles.buildBtn, styles.buildBtnCancel)}
                  onClick={
                    activeModule?.type === "queue"
                      ? () => onQueueCancel(activeModule.index)
                      : onBuiltCancel
                  }
                >
                  Cancel construction
                </Button>
              </>
            )}
        </div>
        <div>
          <h4 className={styles.sectionHeader}>Modules</h4>
          <div className={styles.blueprints}>
            {facilityModules.map((facilityModule, facilityModuleIndex) => (
              <ModuleItem
                isActive={
                  activeModule?.type === "existing" &&
                  facilityModuleIndex === activeModule.index
                }
                onClick={() =>
                  setActiveModule({
                    type: "existing",
                    index: facilityModuleIndex,
                  })
                }
              >
                {facilityModule.cp.name.value}
              </ModuleItem>
            ))}
            {!!queue.building && (
              <ModuleItem
                isActive={activeModule?.type === "built"}
                onClick={() => setActiveModule({ type: "built" })}
              >
                {queue.building.blueprint.name}
                <small className={styles.queueItem}>
                  Building {(queue.building.progress * 100).toFixed(0)}%
                </small>
              </ModuleItem>
            )}
            {queue.queue.map((queueItem, queueItemIndex) => (
              <ModuleItem
                isActive={
                  activeModule?.type === "queue" &&
                  queueItemIndex === activeModule.index
                }
                onClick={() =>
                  setActiveModule({ type: "queue", index: queueItemIndex })
                }
              >
                {queueItem.blueprint.name}
                <small className={styles.queueItem}>in queue</small>
              </ModuleItem>
            ))}
          </div>
        </div>
      </div>
    </Dialog>
  );
};
FacilityModuleManagerComponent.displayName = "FacilityModuleManagerComponent";
