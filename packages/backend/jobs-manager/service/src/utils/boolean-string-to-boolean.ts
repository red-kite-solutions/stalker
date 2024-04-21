export function booleanStringToBoolean({ value }) {
  if (value === 'true') return true;
  if (value === 'false') return false;
  return value;
}
