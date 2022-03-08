//

import {
  isObject,
  extend,
  isArray,
  isIntegerKey,
  hasOwn,
  hasChanged,
} from "@vue/shared";
import { track, trigger } from "./effect";
import { TrackOpTypes, TriggerOpTypes } from "./operations";
import { reactive, readonly } from "./reactive";

function createGetter(isReadonly = false, shallow = false) {
  return function get(target, key, receiver) {
    /**
      receiver 是什么？
      MDN: Proxy或者继承Proxy的对象
      ES6: 它总是指向原始的读操作所在的那个对象，一般情况下就是 Proxy 实例。

      const proxy = new Proxy({}, {
        get: function(target, key, receiver) {
          return receiver;
        }
      });
      proxy.getReceiver === proxy // true

     */

    const res = Reflect.get(target, key, receiver);
    if (!isReadonly) {
      // 进行依赖收集
      track(target, TrackOpTypes.GET, key);
    }

    if (shallow) {
      return res;
    }

    if (isObject(res)) {
      return isReadonly ? readonly(res) : reactive(res);
    }
    return res;
  };
}

function createSetters(shallow = false) {
  return function set(target, key, value, receiver) {
    const oldValue = target[key];

    // 判断 target 是否存在 key 属性，target 可能是数组或者对象
    const hadKey =
      isArray(target) && isIntegerKey(key)
        ? Number(key) < target.length
        : hasOwn(target, key);

    const result = Reflect.set(target, key, value, receiver);

    if (!hadKey) {
      trigger(target, TriggerOpTypes.ADD, key, value);
    } else if (hasChanged(oldValue, value)) {
      trigger(target, TriggerOpTypes.SET, key, value, oldValue);
    }

    return result;
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
