import { isArray, isIntegerKey } from "@vue/shared";
import { createDep } from "./dep";
import { TriggerOpTypes } from "./operations";

let activeEffect;

export class ReactiveEffect<T = any> {
  deps: any = [];

  constructor(public fn: () => T) {}

  run() {
    activeEffect = this as any;
    const result = this.fn();
    activeEffect = undefined;

    return result;
  }

  stop() {}
}

export function effect(fn, options = {}) {
  const _effect = new ReactiveEffect(fn);

  _effect.run();

  const runner = _effect.run as any;

  runner.effect = _effect;

  return runner;
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

  trackEffects(dep);
}

export function trackEffects(dep) {
  if (!dep.has(activeEffect)) {
    dep.add(activeEffect);
    (activeEffect as any).deps.push(dep);
  }
}

export function trigger(target, type, key, newValue?, oldValue?) {
  let deps: any = [];

  const depsMap = targetMap.get(target);

  if (!depsMap) return;
  
  if (key === "length" && isArray(target)) {
    depsMap.forEach((dep, key) => {
      if (key === "length" || key >= newValue) {
        deps.push(dep);
      }
    });
    switch (type) {
      case TriggerOpTypes.ADD:
        if (isArray(target) && isIntegerKey(key)) {
          deps.push(depsMap.get("length"));
        }
    }
  } else {
    if (key !== undefined) {
      deps.push(depsMap.get(key));
    }
  }

  const effects: Array<any> = [];

  // dep 是 Set 数据类型，里面包含 activeEffect
  for (const dep of deps) {
    if (dep) {
      effects.push(...dep);
    }
  }

  // 为啥这里要 new Set() ? 去重?
  triggerEffects(createDep(effects));
}

export function triggerEffects(dep) {
  for (const effect of dep) {
    effect.run();
  }
}
