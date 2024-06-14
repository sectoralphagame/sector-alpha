import React from "react";

interface GraphProps {
  data: number[];
  width: number;
  height: number;
}

const maxPoints = 31;
const offsetX = 60;
const offsetY = 10;

function drawLabel(
  context: CanvasRenderingContext2D,
  value: number,
  width: number,
  height: number,
  max: number
) {
  const y = height - (value / max) * (height - offsetY);
  context.beginPath();
  context.lineWidth = 1;
  context.moveTo(offsetX, y);
  context.lineTo(width, y);
  context.stroke();

  context.textAlign = "right";
  context.fillText(value.toFixed(2), offsetX - 5, y + 4);
}

export const SimAvgTimeGraphComponent: React.FC<GraphProps> = ({
  data,
  width,
  height,
}) => {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    const styles = getComputedStyle(canvasRef.current!);
    const max = Math.max(...data);

    if (context) {
      // Clear the canvas
      context.clearRect(0, 0, width, height);

      // Calculate the scaling factor
      const scaleFactor = (height - offsetY) / max;

      // Draw the graph
      context.strokeStyle = styles.getPropertyValue("--palette-primary");
      context.lineWidth = 2;
      context.moveTo(width, height - data[0] * scaleFactor);
      for (let i = 1; i < data.length; i++) {
        const x =
          ((width - offsetX) / (maxPoints - 1)) * (maxPoints - i - 1) +
          offsetX +
          2;
        context.beginPath();
        context.moveTo(x, height);
        context.lineTo(x, height - data[i] * scaleFactor);
        context.stroke();
      }

      // Draw the axes
      context.beginPath();
      context.strokeStyle = styles.getPropertyValue("--palette-border");
      context.lineWidth = 1;
      context.moveTo(offsetX, offsetY - 5);
      context.lineTo(offsetX, height);
      context.lineTo(width, height);
      context.stroke();

      context.strokeStyle = styles.getPropertyValue("--palette-text-3");
      context.fillStyle = styles.getPropertyValue("--palette-text-1");
      context.font = "normal 18px Monospace";
      [max, (max * 3) / 4, max / 2, max / 4].forEach((value) =>
        drawLabel(context, value, width, height, max)
      );

      context.fillStyle = styles.getPropertyValue("--palette-primary");
      context.textAlign = "right";
      context.fillText(data[0].toFixed(2), offsetX - 5, height);
    }
  }, [data, width, height]);

  return <canvas ref={canvasRef} width={width} height={height} />;
};
