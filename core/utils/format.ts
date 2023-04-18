export function formatTime(time: number): string {
  const hours = Math.floor(time / 360);
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);

  let str = "";
  if (hours > 0) str += `${hours}h `;
  if (minutes > 0) str += `${minutes}min `;
  if (seconds > 0) str += `${seconds}s`;

  if (str.endsWith(" ")) str = str.slice(0, str.length - 1);

  return str;
}
