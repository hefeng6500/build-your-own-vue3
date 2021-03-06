export const isObject = (value) => typeof value == "object" && value !== null;
export const extend = Object.assign;
export const isArray = Array.isArray;
export const isString = (value) => typeof value === "string";
export const isFunction = (value) => typeof value == "function";
const hasOwnProperty = Object.prototype.hasOwnProperty;
export const hasOwn = (target, key) => hasOwnProperty.call(target, key);
export const isIntegerKey = (key) => parseInt(key, 10) === key;
export const hasChanged = (value, oldValue) =>
  value !== oldValue && (value === value || oldValue === oldValue);

export * from "./shapeFlags";
