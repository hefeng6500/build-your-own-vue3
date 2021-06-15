export const isObject = (value) => typeof value == "object" && value !== null;
export const extend = Object.assign;
export const isArray = Array.isArray;
const hasOwnProperty = Object.prototype.hasOwnProperty;
export const hasOwn = (target, key) => hasOwnProperty.call(target, key);
export const isIntegerKey = (key) => parseInt(key, 10) === key;
export const hasChanged = (value, oldValue) =>
  value !== oldValue && (value === value || oldValue === oldValue);
