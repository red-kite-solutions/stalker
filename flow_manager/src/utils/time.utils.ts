export function getLogTimestamp() {
  const date = new Date();

  // prints date & time in [YYYY-MM-DD HH:MM:SS] format
  return `[${date.getFullYear()}-${('0' + (date.getMonth() + 1)).slice(-2)}-${(
    '0' + date.getDate()
  ).slice(-2)} ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}]`;
}
