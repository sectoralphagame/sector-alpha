import React from "react";

interface GraphProps {
  data: number[];
  width: number;
  height: number;
  scale: number;
}

const maxPoints = 31;
const offsetX = 60;
const offsetY = 10;

function drawLabel(
  context: CanvasRenderingContext2D,
  value: number,
  width: number,
  height: number,
  max: number,
  scale: number
) {
  const y = height - (value / max) * (height - offsetY * scale);
  context.beginPath();
  context.lineWidth = 1 * scale;
  context.moveTo(offsetX * scale, y);
  context.lineTo(width, y);
  context.stroke();

  context.textAlign = "right";
  context.fillText(value.toFixed(2), (offsetX - 5) * scale, y + 4 * scale);
}

export const SimAvgTimeGraphComponent: React.FC<GraphProps> = ({
  data,
  width: widthProp,
  height: heightProp,
  scale,
}) => {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const width = widthProp * scale;
  const height = heightProp * scale;

  React.useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    const styles = getComputedStyle(canvasRef.current!);
    const max = Math.max(...data, Math.floor(1000 / 240));

    if (context) {
      // Clear the canvas
      context.clearRect(0, 0, width, height);

      // Calculate the scaling factor
      const scaleFactor = (height - offsetY * scale) / max;

      // Draw the graph
      context.strokeStyle = styles.getPropertyValue("--palette-primary");
      context.lineWidth = 2 * scale;
      context.moveTo(width, height - data[0] * scaleFactor);
      for (let i = 1; i < data.length; i++) {
        const x =
          ((width - offsetX * scale) / (maxPoints - 1)) * (maxPoints - i - 1) +
          offsetX * scale +
          2;
        context.beginPath();
        context.moveTo(x, height);
        context.lineTo(x, height - data[i] * scaleFactor);
        context.stroke();
      }

      // Draw the axes
      context.beginPath();
      context.strokeStyle = styles.getPropertyValue("--palette-border");
      context.lineWidth = scale;
      context.moveTo(offsetX * scale, (offsetY - 5) * scale);
      context.lineTo(offsetX * scale, height);
      context.lineTo(width, height);
      context.stroke();

      context.strokeStyle = styles.getPropertyValue("--palette-text-3");
      context.fillStyle = styles.getPropertyValue("--palette-text-1");
      context.font = `normal ${18 * scale}px Monospace`;
      [max, (max * 3) / 4, max / 2, max / 4].forEach((value) =>
        drawLabel(context, value, width, height, max, scale)
      );

      context.fillStyle = styles.getPropertyValue("--palette-primary");
      context.textAlign = "right";
      context.fillText(data[0].toFixed(2), (offsetX - 5) * scale, height);
    }
  }, [data, width, height]);

  return <canvas ref={canvasRef} width={width} height={height} />;
};
