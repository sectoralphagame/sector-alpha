export function formatTime(time: number): string {
  const hours = Math.floor(time / 3600);
  const minutes = Math.floor((time % 3600) / 60);
  const seconds = Math.floor(time % 60);

  let str = "";
  if (hours > 0) str += `${hours}h `;
  if (minutes > 0) str += `${minutes}min `;
  if (seconds > 0) str += `${seconds}s`;

  if (str.endsWith(" ")) str = str.slice(0, str.length - 1);

  return str;
}

export function formatGameTime(
  time: number,
  variant: "short" | "full" = "short"
): string {
  const hours = time % 24;
  const days = Math.floor(time / 24) % 30;
  const years = Math.floor(time / 24 / 30 / 12);

  let str = "";
  if (years > 0)
    str +=
      variant === "short"
        ? `${years}y `
        : `${years} year${years > 1 ? "s" : ""} `;
  if (days > 0)
    str +=
      variant === "short" ? `${days}d ` : `${days} day${days > 1 ? "s" : ""} `;
  if (hours > 0)
    str +=
      variant === "short"
        ? `${hours}h`
        : `${hours} hour${hours > 1 ? "s" : ""}`;

  if (str.endsWith(" ")) str = str.slice(0, str.length - 1);

  return str;
}
