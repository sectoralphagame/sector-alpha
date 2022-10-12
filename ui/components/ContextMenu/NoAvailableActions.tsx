import React from "react";
import { DropdownOption } from "../Dropdown";

export const NoAvailableActions: React.FC = () => (
  <DropdownOption disabled onClick={() => undefined}>
    No available actions
  </DropdownOption>
);

NoAvailableActions.displayName = "NoAvailableActions";
