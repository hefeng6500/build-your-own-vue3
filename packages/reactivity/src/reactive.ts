import { isObject,  } from "@vue/shared";
import {
  mutableHandlers,
  shallowReactiveHandlers,
  readonlyHandlers,
  shallowReadonlyHandlers,
} from "./baseHandlers";

export function reactive(target) {
  return createReactiveObject(target, false, mutableHandlers);
}

export function shallowReactive(target) {
  return createReactiveObject(target, false, shallowReactiveHandlers);
}

export function readonly(target) {
  return createReactiveObject(target, true, readonlyHandlers);
}

export function shallowReadonly(target) {
  return createReactiveObject(target, false, shallowReadonlyHandlers);
}

export function createReactiveObject(target, isReadonly, baseHandlers) {
  if (!isObject(target)) {
    return target;
  }

  const proxy = new Proxy(target, baseHandlers);
  return proxy;
}
