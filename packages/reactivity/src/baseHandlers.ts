//

import { isObject, extend } from "@vue/shared";
import { reactive, readonly } from "./reactive";

function createGetter(isReadonly = false, shallow = false) {
  return function get(target, key, receiver) {
    const res = Reflect.get(target, key, receiver);

    if (!isReadonly) {
      // 进行依赖收集
    }

    if (shallow) {
      return res;
    }

    if (isObject) {
      return isReadonly ? readonly(res) : reactive(res);
    }
    return res;
  };
}

function createSetters(shallow = false) {
  return function set(target, key, value, receiver) {
    const result = Reflect.set(target, key, value, receiver);
  };
}

const get = createGetter();
const set = createSetters();
const shallowGet = createGetter(false, true);
const shallowSet = createSetters(true);
const readonlyGet = createGetter(true);
const shallowReadonlyGet = createGetter(true, true);
const readonlyObj = {
  set(target, key) {
    console.warn(
      `Set operation on key "${String(key)}" failed: target is readonly.`,
      target
    );
  },
};

export const mutableHandlers = {
  get,
  set,
};

export const shallowReactiveHandlers = {
  get: shallowGet,
  set: shallowSet,
};

export const readonlyHandlers = extend(
  {
    get: readonlyGet,
  },
  readonlyObj
);

export const shallowReadonlyHandlers = extend(
  {
    get: shallowReadonlyGet,
  },
  readonlyObj
);
