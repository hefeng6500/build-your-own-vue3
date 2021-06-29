import { hasChanged, isArray, isObject } from "@vue/shared";
import { track, trigger } from "./effect";
import { TrackOpTypes, TriggerOpTypes } from "./operations";
import { reactive } from "./reactive";

export function ref(value) {
  return createRef(value);
}

export function shallowRef(value) {
  return createRef(value, true);
}

export function toRef(target, key) {
  return new ObjectRefImpl(target, key);
}

export function toRefs(object) {
  const ret = isArray(object) ? new Array(object.length) : {};
  for (let key in object) {
    ret[key] = toRef(object, key);
  }
  return ret;
}

function createRef(rawValue, shallow = false) {
  return new RefImpl(rawValue, shallow);
}

const convert = (val) => (isObject(val) ? reactive(val) : val);

// beta 版本 之前的版本ref 就是个对象 ，由于对象不方便扩展 改成了类
class RefImpl {
  public _value;
  public __v_isRef = true;

  constructor(public rawValue, public shallow) {
    // 如果是深度的，需要把里面的变成响应式的
    this._value = shallow ? rawValue : convert(rawValue);
  }

  get value() {
    // 依赖收集，key 为固定的 value
    track(this, TrackOpTypes.GET, "value");

    return this._value;
  }

  set value(newValue) {
    // setter，只处理 value 属性的修改
    if (hasChanged(newValue, this.rawValue)) {
      this.rawValue = newValue;
      this._value = this.shallow ? newValue : convert(newValue);

      // 派发通知
      trigger(this, TriggerOpTypes.SET, "value", newValue);
    }
  }
}

class ObjectRefImpl {
  public __v_isRef = true;
  constructor(public target, public key) {}
  get value() {
    return this.target[this.key];
  }
  set value(newValue) {
    this.target[this.key] = newValue;
  }
}
