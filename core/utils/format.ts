import { gameHour, gameYear } from "./misc";

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
  variant: "veryshort" | "short" | "full" = "short"
): string {
  const years = Math.floor(time / 24 / 30 / 12);
  const days = Math.floor((time - years * gameYear) / 24);
  const months = Math.floor((time - years * gameYear) / 24 / 30);
  const hours = Math.floor((time / gameHour) % 24);

  const parts: string[] = [];

  if (variant === "veryshort") {
    if (years > 0) return `${years}y`;
    if (days > 0) return `${days}d`;
    if (hours > 0) return `${hours}h`;
    return "seconds";
  }

  if (variant === "short") {
    if (years > 0) parts.push(`${years}y`);
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
  } else {
    if (years > 0) parts.push(`${years} year${years > 1 ? "s" : ""}`);
    if (months % 12 > 0)
      parts.push(`${months % 12} month${months % 12 > 1 ? "s" : ""}`);
    if (days % 30 > 0)
      parts.push(`${days % 30} day${days % 30 > 1 ? "s" : ""}`);
    if (hours > 0) parts.push(`${hours} hour${hours > 1 ? "s" : ""}`);
  }
  return parts.join(" ");
}
