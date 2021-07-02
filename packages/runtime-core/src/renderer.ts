import { effect } from "@vue/reactivity";
import { ShapeFlags } from "packages/shared/src/shapeFlags";
import { createAppApi } from "./apiCreateApp";
import { createComponentInstance, setupComponent } from "./component";
import { queueJob } from "./scheduler";
import { normalizeVNode, Text } from "./vnode";

export function createRenderer(rendererOptions) {
  const {
    insert: hostInsert,
    remove: hostRemove,
    patchProp: hostPatchProp,
    createElement: hostCreateElement,
    createText: hostCreateText,
    createComment: hostCreateComment,
    setText: hostSetText,
    setElementText: hostSetElementText,
  } = rendererOptions;

  const setRendererEffect = (instance, container) => {
    // 需要创建一个effect 在effect中调用 render方法，这样render方法中拿到的数据会收集这个effect，属性更新时effect会重新执行

    instance.update = effect(
      function componentEffect() {
        debugger
        // 每个组件都有一个effect， vue3 是组件级更新，数据变化会重新执行对应组件的effect
        if (!instance.isMounted) {
          // 初次渲染
          let proxyToUse = instance.proxy;
          // $vnode  _vnode
          // vnode  subTree
          let subTree = (instance.subTree = instance.render.call(
            proxyToUse,
            proxyToUse
          ));

          // 用render函数的返回值 继续渲染
          patch(null, subTree, container);
          instance.isMounted = true;
        } else {
          console.log("update");
          
        }
      },
      {
        scheduler: queueJob,
      }
    );
  };

  const mountComponent = (initialVnode, container) => {
    // 1. 创建实例
    const instance = (initialVnode.component =
      createComponentInstance(initialVnode));

    // 2. 需要的数据解析到实例上
    setupComponent(instance);

    // 3. 创建一个 effect 让 renderer 执行
    setRendererEffect(instance, container);
  };

  // 更新组件
  const processComponent = (n1, n2, container) => {
    if (n1 == null) {
      mountComponent(n2, container);
    }
  };

  const mountChildren = (children, container) => {
    for (let i = 0; i < children.length; i++) {
      let child = normalizeVNode(children[i]);

      patch(null, child, container);
    }
  };

  // 渲染元素
  const mountElement = (vnode, container) => {
    const { type, props, shapeFlag, children } = vnode;

    let el = (vnode.el = hostCreateElement(type));

    if (props) {
      for (let key in props) {
        hostPatchProp(el, key, null, props[key]);
      }
    }

    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      hostSetElementText(el, children); // 字符串文本
    } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      mountChildren(children, el);
    }
    hostInsert(el, container);
  };
  // 更新
  const processElement = (n1, n2, container) => {
    if (n1 == null) {
      mountElement(n2, container);
    } else {
      // 元素更新
    }
  };

  // 处理文本节点
  const processText = (n1, n2, container) => {
    if (n2 == null) {
      hostInsert((n2.el = hostCreateText(n2.children)), container);
    }
  };

  // 派发更新 dom 节点
  const patch = (n1, n2, container) => {
    const { shapeFlag, type } = n2;
    switch (type) {
      case Text:
        processText(n1, n2, container);
        break;

      default:
        if (shapeFlag & ShapeFlags.ELEMENT) {
          processElement(n1, n2, container);
        } else if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
          processComponent(n1, n2, container);
        }
        break;
    }
  };
  const render = (vnode, container) => {
    // 首次渲染时，之前没有虚拟节点
    patch(null, vnode, container);
  };

  return {
    createApp: createAppApi(render),
  };
}
