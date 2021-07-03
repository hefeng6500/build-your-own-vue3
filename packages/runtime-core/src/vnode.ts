import { isArray, isObject, isString } from "@vue/shared";
import { ShapeFlags } from "packages/shared/src/shapeFlags";

export function isVnode(vnode) {
  return vnode.__v_isVnode;
}

export const createVNode = (type, props, children = null) => {
  const shapeFlag = isString(type)
    ? ShapeFlags.ELEMENT // 0
    : isObject(type)
    ? ShapeFlags.STATEFUL_COMPONENT // 4
    : 0;

  const vnode = {
    __v_isVnode: true,
    type,
    props,
    children,
    component: null,
    el: null,
    key: props && props.key,
    shapeFlag,
  };

  normalizeChildren(vnode, children);

  return vnode;
};

function normalizeChildren(vnode, children) {
  let type = 0;
  if (children == null) {
    // 不对儿子进行处理
  } else if (isArray(children)) {
    type = ShapeFlags.ARRAY_CHILDREN;
  } else {
    type = ShapeFlags.TEXT_CHILDREN;
  }
  vnode.shapeFlag |= type;
}

export const Text = Symbol("text");

export const normalizeVNode = (child) => {
  if (isObject(child)) return child;

  return createVNode(Text, null, String(child));
};
