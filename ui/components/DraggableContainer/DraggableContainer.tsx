import React from "react";
import clsx from "clsx";
import styles from "./DraggableContainer.scss";

export const DraggableContainer: React.FC<
  React.PropsWithChildren<{ className?: string }>
> = ({ children, className }) => {
  const [isDragging, setIsDragging] = React.useState(false);
  const [position, setPosition] = React.useState({
    x: window.innerWidth - 400,
    y: 0,
  });
  const offsetRef = React.useRef({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    offsetRef.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    };
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - offsetRef.current.x,
        y: e.clientY - offsetRef.current.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  React.useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging]);

  return (
    <aside
      className={styles.container}
      style={{
        position: "fixed",
        left: Math.max(50, Math.min(window.innerWidth - 50, position.x)),
        top: Math.max(50, Math.min(window.innerHeight - 50, position.y)),
      }}
    >
      {/* eslint-disable-next-line jsx-a11y/control-has-associated-label, react/button-has-type */}
      <button
        className={clsx(styles.handle, className)}
        style={{ cursor: "move" }}
        onMouseDown={handleMouseDown}
      />
      {children}
    </aside>
  );
};
