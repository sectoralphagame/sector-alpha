import { Table, TableCell } from "@devtools/components/Table";
import { TableHeader } from "@kit/Table";
import React from "react";
import { render } from "./render";
import { stars as starsData } from "./stars";
import styles from "./Map.scss";

const stars = starsData.map((s) => {
  const [, hours, raMinutes, raSeconds] = s.ra.match(/(.*)h (.*)m (.*)s/)!;
  const [, degrees, dMinutes, dSeconds] = s.d
    .replace("−", "-")
    .match(/(.*)° (.*)′ (.*)″/)!;
  return {
    ...s,
    ra: {
      hours: parseFloat(hours),
      minutes: parseFloat(raMinutes),
      seconds: parseFloat(raSeconds),
    },
    d: {
      degrees: parseFloat(degrees),
      minutes: parseFloat(dMinutes),
      seconds: parseFloat(dSeconds),
    },
  };
});

type RightAscension = Record<"hours" | "minutes" | "seconds", number>;
function rightAscensionToDegrees({ hours, minutes, seconds }: RightAscension) {
  return hours * 15 + minutes * 0.25 + seconds * 0.004166;
}

type Declination = Record<"degrees" | "minutes" | "seconds", number>;
function declinationToDegrees({ degrees, minutes, seconds }: Declination) {
  return (
    (Math.abs(degrees) + minutes / 60 + seconds / 3600) * Math.sign(degrees)
  );
}

function toCartesian(ra: RightAscension, d: Declination, r: number) {
  const raDeg = (rightAscensionToDegrees(ra) * 2 * Math.PI) / 360;
  const dDeg = (declinationToDegrees(d) * 2 * Math.PI) / 360;

  const x = r * Math.cos(dDeg) * Math.cos(raDeg);
  const y = r * Math.cos(dDeg) * Math.sin(raDeg);
  const z = r * Math.sin(dDeg);

  return { x, y, z };
}

type Point = Record<"x" | "y" | "z", number>;
function dist(p1: Point, p2: Point) {
  return Math.sqrt(
    (p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2 + (p1.z - p2.z) ** 2
  );
}

const starsWithCoords = stars.map((s) => ({
  name: s.name,
  coords: toCartesian(s.ra, s.d, s.r),
}));

const distanceMatrix = starsWithCoords.map((s) =>
  starsWithCoords.map((st) => dist(s.coords, st.coords))
);

const content = starsWithCoords.map((_, sIndex) => {
  const distances = starsWithCoords.map(
    (_star, stIndex) => distanceMatrix[sIndex][stIndex]
  );

  return {
    name: stars[sIndex].name,
    mean: (distances.reduce((a, b) => a + b, 0) / distances.length).toFixed(2),
    distances,
  };
});

export const UniverseMap: React.FC = () => {
  const [canvas, setCanvas] = React.useState<HTMLCanvasElement | null>(null);
  React.useEffect(() => {
    if (canvas) {
      render(
        starsWithCoords.map((s) => ({
          ...s.coords,
          name: s.name,
        })),
        canvas
      );
    }
  }, [canvas]);

  return (
    <>
      <canvas
        height={window.innerHeight}
        width={window.innerWidth}
        ref={setCanvas}
      />
      <div className={styles.tableContainer}>
        <Table>
          <thead>
            <tr>
              <TableHeader />
              {starsWithCoords.map((s) => (
                <TableHeader key={s.name}>{s.name}</TableHeader>
              ))}
            </tr>
          </thead>
          <tbody>
            {content.map((row) => (
              <tr key={row.name}>
                <TableHeader>{row.name}</TableHeader>
                {row.distances.map((cell) => (
                  <TableCell
                    key={cell}
                    style={{
                      color:
                        cell ===
                        Math.min(...row.distances.filter((d) => d !== 0))
                          ? "green"
                          : cell === 0
                          ? "black"
                          : "",
                    }}
                  >
                    {cell.toFixed(2)}
                  </TableCell>
                ))}
              </tr>
            ))}
          </tbody>
        </Table>
      </div>
    </>
  );
};
