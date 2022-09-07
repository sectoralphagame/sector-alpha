import React from "react";
import SVG from "react-inlinesvg";
import clsx from "clsx";
import arrowLeftIcon from "../../../assets/ui/arrow_left.svg";
import { IconButton } from "../../ui/components/IconButton";
import { styles } from "./styles";
import { useThrottledFormState } from "./utils";
import { Button } from "../../ui/components/Button";

export const JSONOutput: React.FC<{
  expanded: boolean;
  onExpand: () => void;
}> = ({ expanded, onExpand }) => {
  const data = useThrottledFormState<FormData>();
  const display = React.useMemo(
    () => (data ? JSON.stringify(Object.values(data!)[0]) : null),
    [data]
  );

  return (
    <div className={styles.viewer}>
      <div className={styles.toolbar}>
        <IconButton onClick={onExpand}>
          <SVG
            src={arrowLeftIcon}
            className={clsx({
              [styles.rotate]: expanded,
            })}
          />
        </IconButton>
        <Button
          onClick={() => {
            navigator.clipboard.writeText(display!);
          }}
        >
          Copy
        </Button>
      </div>
      {/* @ts-expect-error */}
      {expanded && <json-viewer data={display} />}
    </div>
  );
};
