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

export function formatGameTime(time: number): string {
  const hours = time % 24;
  const days = Math.floor(time / 24) % 30;
  const years = Math.floor(time / 24 / 30 / 12);

  let str = "";
  if (years > 0) str += `${years}y `;
  if (days > 0) str += `${days}d `;
  if (hours > 0) str += `${hours}h`;

  if (str.endsWith(" ")) str = str.slice(0, str.length - 1);

  return str;
}
