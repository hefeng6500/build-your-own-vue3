import { isArray, isIntegerKey } from "@vue/shared";
import { TriggerOpTypes } from "./operations";

let effectStack = [];
let uid = 0;
let activeEffect;

export function effect(fn, options = {}) {
  // 创建响应式的 effect，当数据变化时重新执行
  const effect = createReactiveEffect(fn, options);
  effect();
  return effect;
}

export function createReactiveEffect(fn, options) {
  const effect = function reactiveEffect() {
    if (!effectStack.includes(effect)) {
      try {
        effectStack.push(effect);
        activeEffect = effect;
        return fn();
      } finally {
        effectStack.pop();
        activeEffect = effectStack[effectStack.length - 1];
      }
    }
  };

  effect.id = uid++;
  effect._isEffect = true;
  effect.raw = fn;
  effect.options = options;

  return effect;
}

let targetMap = new Map();
export function track(target, type, key) {
  if (activeEffect === undefined) {
    return;
  }

  let depsMap = targetMap.get(target);
  if (!depsMap) {
    targetMap.set(target, (depsMap = new Map()));
  }
  let dep = depsMap.get(key);
  if (!dep) {
    depsMap.set(key, (dep = new Set()));
  }
  if (!dep.has(activeEffect)) {
    dep.add(activeEffect);
  }
}

export function trigger(target, type, key, newValue, oldValue?) {
  const depsMap = targetMap.get(target);

  if (!depsMap) return;

  let effects = new Set();
  const add = function (effectsToAdd) {
    effectsToAdd.forEach((effect) => {
      effects.add(effect);
    });
  };

  if (isArray(target)) {
    depsMap.forEach((dep, key) => {
      if (key === "length" || newValue < key) {
        add(dep);
      }
    });
    switch (type) {
      case TriggerOpTypes.ADD:
        if (isArray(target) && isIntegerKey(key)) {
          add(depsMap.get("length"));
        }
    }
  } else {
    if (key !== undefined) {
      add(depsMap.get(key));
    }
  }
  effects.forEach((effect: any) => {
    effect()
  });
}
