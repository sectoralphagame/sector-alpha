import { Button } from "@kit/Button";
import { Dialog } from "@kit/Dialog";
import { DialogActions } from "@kit/DialogActions";
import { Slider } from "@kit/Slider";
import React from "react";
import type { ModalProps } from "../ConfigDialog";
import styles from "./FacilityMoneyManager.scss";

interface FacilityMoneyManagerComponentProps extends ModalProps {
  availableMoney: number;
  neededMoney: number;
  currentMoney: number;
  onChange: (_value: number) => void;
}

export const FacilityMoneyManagerComponent: React.FC<
  FacilityMoneyManagerComponentProps
> = ({
  onClose,
  open,
  availableMoney,
  currentMoney,
  neededMoney,
  onChange,
}) => {
  const [money, setMoney] = React.useState(currentMoney);
  const diff = money - currentMoney;
  const maxMoney = availableMoney + currentMoney;

  return (
    <Dialog
      width="500px"
      open={open}
      onClose={onClose}
      title="Manage facility budget"
    >
      <div className={styles.grid}>
        <span>Expected budget:</span>
        <span>{neededMoney} UTT</span>
        <span>Budget:</span>
        <span>
          <input
            className={styles.input}
            value={money}
            onChange={(event) => setMoney(parseInt(event.target.value, 10))}
            type="number"
          />
          /{maxMoney} UTT
        </span>
        <span>Change:</span>
        <span
          className={
            diff > 0
              ? styles.diffPositive
              : diff < 0
              ? styles.diffNegative
              : undefined
          }
        >
          {diff >= 0 ? "+" : ""}
          {diff}
        </span>
      </div>
      <Slider
        className={styles.slider}
        min={0}
        max={maxMoney}
        value={money}
        step={1}
        onChange={(event) => setMoney(parseInt(event.target.value, 10))}
      />
      <DialogActions>
        <Button onClick={() => setMoney(Math.min(neededMoney, maxMoney))}>
          Set expected
        </Button>
        <Button onClick={() => setMoney(currentMoney)}>Reset</Button>
        <Button
          onClick={() => onChange(diff)}
          disabled={diff > availableMoney || money < 0}
          color="primary"
        >
          Accept
        </Button>
      </DialogActions>
    </Dialog>
  );
};
FacilityMoneyManagerComponent.displayName = "FacilityMoneyManagerComponent";
