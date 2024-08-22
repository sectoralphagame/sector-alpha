import React from "react";
import { useFormContext } from "react-hook-form";
import { commodityLabel, type Commodity } from "@core/economy/commodity";
import { Input } from "@kit/Input";
import { TableCell } from "@kit/Table";
import Text from "@kit/Text";
import { IconButton } from "@kit/IconButton";
import { ChevronLeftIcon, ChevronRightIcon } from "@assets/ui/icons";
import styles from "./TradeDialog.scss";

export interface TradeDialogLineProps {
  buyDisabled: boolean;
  sellDisabled: boolean;
  commodity: Commodity;
  offerType: "buy" | "sell";
  price: number;
  availableQuantity: number;
  max: number;
  hasAction: boolean;
}

export const TradeDialogLine: React.FC<TradeDialogLineProps> = ({
  buyDisabled,
  sellDisabled,
  commodity,
  max,
  offerType,
  price,
  availableQuantity,
  hasAction,
}) => {
  const { register, getValues, setValue } = useFormContext();

  return (
    <tr className={styles.row} key={commodity}>
      <TableCell className={styles.colName}>
        {commodityLabel[commodity]}
      </TableCell>
      <TableCell>
        <Text variant="caption" color={sellDisabled ? "disabled" : "default"}>
          {offerType === "sell" ? price : "-"}
        </Text>
      </TableCell>
      <TableCell>
        <Text variant="caption" color={buyDisabled ? "disabled" : "default"}>
          {offerType === "buy" ? price : "-"}
        </Text>
      </TableCell>
      <TableCell>
        <Text variant="caption" color={sellDisabled ? "disabled" : "default"}>
          {offerType === "sell" ? availableQuantity : "-"}
        </Text>
      </TableCell>
      <TableCell>
        <Text variant="caption" color={buyDisabled ? "disabled" : "default"}>
          {offerType === "buy" ? availableQuantity : "-"}
        </Text>
      </TableCell>
      {hasAction && (
        <TableCell>
          <IconButton
            variant="naked"
            onClick={() => setValue(commodity, 0)}
            disabled={getValues()[commodity] <= 0}
          >
            <ChevronLeftIcon />
          </IconButton>
          <Input
            className={styles.input}
            placeholder="0"
            type="number"
            max={max}
            min={0}
            {...register(commodity)}
          />
          <Text
            variant="caption"
            component="span"
            className={styles.max}
            color="text-3"
          >
            {max}
          </Text>
          <IconButton
            variant="naked"
            onClick={() => setValue(commodity, max)}
            disabled={getValues()[commodity] >= max}
          >
            <ChevronRightIcon />
          </IconButton>
        </TableCell>
      )}
    </tr>
  );
};
TradeDialogLine.displayName = "TradeDialogLine";
