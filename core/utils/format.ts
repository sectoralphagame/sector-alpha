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
  const hours = Math.floor(time % 24);
  const days = Math.floor(time / 24);
  const months = Math.floor(time / 24 / 30) % 12;
  const years = Math.floor(time / 24 / 30 / 12);

  let str = "";

  if (variant === "veryshort") {
    if (years > 0) return `${years}y`;
    if (days % (12 * 30) > 0) return `${days % (12 * 30)}d`;
    if (hours > 0) return `${hours}h`;
    return "seconds";
  }

  if (variant === "short") {
    if (years > 0) str += `${years}y`;
    if (days % (12 * 30) > 0) str += `${days % (12 * 30)}d`;
    if (hours > 0) str += `${hours}h`;

    return str;
  }

  if (years > 0) str += `${years} year${years > 1 ? "s" : ""} `;
  if (months % 12 > 0)
    str += `${months % 12} day${months % 12 > 1 ? "s" : ""} `;
  if (days % 30 > 0) str += `${days % 30} day${days % 30 > 1 ? "s" : ""} `;
  if (hours > 0) str += `${hours} hour${hours > 1 ? "s" : ""}`;

  if (str.endsWith(" ")) str = str.slice(0, str.length - 1);

  return str;
}
