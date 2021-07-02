import { isFunction, isObject, ShapeFlags } from "@vue/shared";
import { PublicInstanceProxyHandlers } from "./componentPublicInstance";

export function createComponentInstance(vnode) {
  const instance = {
    vnode,
    type: vnode.type,
    props: {},
    attrs: {},
    slots: {},
    ctx: {},
    data: {},
    setupState: {},
    render: null,
    subTree: null,
    isMounted: false,
  };
  instance.ctx = { _: instance };
  return instance;
}

export function setupComponent(instance) {
  const { props, children } = instance.vnode;

  instance.props = props;
  instance.children = children;

  let isStateful = instance.vnode.shapeFlag & ShapeFlags.STATEFUL_COMPONENT;

  if (isStateful) {
    setupStatefulComponent(instance);
  }
}

function setupStatefulComponent(instance) {
  instance.proxy = new Proxy(instance.ctx, PublicInstanceProxyHandlers as any);

  let Component = instance.type;
  let { setup } = Component;
  if (setup) {
    let setupContext = createSetupContext(instance);
    const setupResult = setup(instance.props, setupContext);

    handleSetupResult(instance, setupResult);
  } else {
    finishComponentSetup(instance); // 完成组件的启动
  }
}

function handleSetupResult(instance, setupResult) {
  if (isFunction(setupResult)) {
    instance.render = setupResult;
  } else if (isObject(setupResult)) {
    instance.setupState = setupResult;
  }
  finishComponentSetup(instance);
}

function finishComponentSetup(instance) {
  let Component = instance.type;
  if (!instance.render) {
    if (!Component.render && Component.template) {
    }
    instance.render = Component.render;
  }
}

function createSetupContext(instance) {
  return {
    attrs: instance.attrs,
    slots: instance.slots,
    emit: () => {},
    expose: () => {},
  };
}
