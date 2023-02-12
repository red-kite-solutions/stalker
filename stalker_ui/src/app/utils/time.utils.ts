export function getLogTimestamp(time: number = Date.now()) {
  const date = new Date(time);

  // prints date & time in [YYYY-MM-DD HH:MM:SS] format
  return `[${date.getFullYear()}-${('0' + (date.getMonth() + 1)).slice(-2)}-${('0' + date.getDate()).slice(
    -2
  )} ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}]`;
}
