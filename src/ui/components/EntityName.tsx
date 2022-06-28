import React from "react";
import { useForm } from "react-hook-form";
import { nano } from "../../style";
import { RequireComponent } from "../../tsHelpers";

const styles = nano.sheet({
  input: {
    "&:focus": {
      backgroundColor: "white",
      color: "black",
    },
    border: "none",
    background: "none",
    borderBottom: "1px solid white",
    color: "inherit",
    fontSize: "inherit",
    marginBottom: "8px",
    outline: 0,
    paddingBottom: "8px",
    width: "100%",
  },
});

const EntityName: React.FC<{ entity: RequireComponent<"name"> }> = ({
  entity,
}) => {
  const { register, handleSubmit, reset, getValues } = useForm();

  React.useEffect(reset, [entity]);

  const onSubmit = () => {
    entity.cp.name.value = getValues().name || "Unnamed Sector";
    reset();
  };

  return (
    <form autoComplete="off" onSubmit={handleSubmit(onSubmit)}>
      <input
        {...register("name", {
          onBlur: onSubmit,
        })}
        className={styles.input}
        defaultValue={entity.cp.name.value}
      />
    </form>
  );
};

export default EntityName;
