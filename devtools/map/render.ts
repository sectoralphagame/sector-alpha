const scale = 10;

function circle(x: number, y: number, ctx: CanvasRenderingContext2D) {
  ctx.beginPath();
  ctx.arc(
    x * scale + window.innerWidth / 2,
    y * scale + window.innerHeight / 2,
    5,
    0,
    2 * Math.PI
  );
  ctx.fill();
  ctx.closePath();
}

function littleText(
  x: number,
  y: number,
  text: string,
  ctx: CanvasRenderingContext2D
) {
  ctx.textAlign = "center";
  ctx.fillText(
    text,
    x * scale + window.innerWidth / 2,
    y * scale + window.innerHeight / 2 - 6
  );
}

export function render(
  coords: Array<Record<"x" | "y" | "z", number> & { name: string }>,
  canvas: HTMLCanvasElement
) {
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "white";
  ctx.strokeStyle = "white";

  coords.forEach(({ x, y, z, name }) => {
    const angle = Math.atan2(y, x);
    const radius = Math.sqrt(x ** 2 + y ** 2 + z ** 2);

    const fixedX = Math.cos(angle) * radius;
    const fixedY = Math.sin(angle) * radius;

    circle(fixedX, fixedY, ctx);
    littleText(fixedX, fixedY, name, ctx);
  });
}
