import { effect } from "@vue/reactivity";
import { ShapeFlags } from "packages/shared/src/shapeFlags";
import { createAppApi } from "./apiCreateApp";
import { createComponentInstance, setupComponent } from "./component";
import { queueJob } from "./scheduler";
import { normalizeVNode, Text } from "./vnode";
import { invokeArrayFns } from "./apiLifecycle";

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
    nextSibling: hostNextSibling,
  } = rendererOptions;

  const setRendererEffect = (instance, container) => {
    // 需要创建一个effect 在effect中调用 render方法，这样render方法中拿到的数据会收集这个effect，属性更新时effect会重新执行

    instance.update = effect(
      function componentEffect() {
        // 每个组件都有一个effect， vue3 是组件级更新，数据变化会重新执行对应组件的effect
        if (!instance.isMounted) {
          let { bm, m } = instance;

          if (bm) {
            invokeArrayFns(bm);
          }

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

          if (m) {
            // mounted 要求必须在我们子组件完成后才会调用自己
            invokeArrayFns(m);
          }
        } else {
          console.log("update");
          let { bu, u } = instance;

          if (bu) {
            invokeArrayFns(bu);
          }

          const prevTree = instance.subTree;
          let proxyToUse = instance.proxy;
          const nextTree = instance.render.call(proxyToUse, proxyToUse);

          patch(prevTree, nextTree, container);
          if (u) {
            invokeArrayFns(u);
          }
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

  const patchProps = (oldProps, newProps, el) => {
    if (oldProps !== newProps) {
      for (let key in newProps) {
        const prev = oldProps[key];
        const next = newProps[key];
        if (prev !== next) {
          hostPatchProp(el, key, prev, next);
        }
      }
      for (const key in oldProps) {
        if (!(key in newProps)) {
          hostPatchProp(el, key, oldProps[key], null);
        }
      }
    }
  };

  const unmountChildren = (children) => {
    for (let i = 0; i < children.length; i++) {
      unmount(children[i]);
    }
  };

  const patchKeyedChildren = (c1, c2, el) => {
    // Vue3 对特殊情况进行优化

    let i = 0; // 都是默认从头开始比对
    let e1 = c1.length - 1;
    let e2 = c2.length - 1;

    // 尽可能较少比对的区域

    // from start 从头部开始比，遇到不同的就停止
    while (i <= e1 && i <= e2) {
      const n1 = c1[i];
      const n2 = c2[i];
      if (isSameVNodeType(n1, n2)) {
        patch(n1, n2, el);
      } else {
        break;
      }
      i++;
    }
    // from end 从尾部开始比，遇到不同的就停止
    while (i <= e1 && i <= e2) {
      const n1 = c1[e1];
      const n2 = c2[e2];
      if (isSameVNodeType(n1, n2)) {
        patch(n1, n2, el);
      } else {
        break;
      }
      e1--;
      e2--;
    }

    // common sequence + mount  有一方已经完全比对完成了
    // 比较后
    // 怎么确定是要挂载呢？

    // 如果完成后 最终i的值大于e1 说明老的少

    if (i > e1) {
      // 老的少 新的多   有一方已经完全比对完成了
      if (i <= e2) {
        // 表示有新增的部分
        const nextPos = e2 + 1;
        // 设定一个 anchor 锚点，标定插入位置，向前插入还是向后插入
        const anchor = nextPos < c2.length ? c2[nextPos].el : null;

        while (i <= e2) {
          patch(null, c2[i], el, anchor);
          i++;
        }
      }
    } else if (i > e2) {
      // 老的多新的少    有一方已经完全比对完成了
      while (i <= e1) {
        unmount(c1[i]);
        i++;
      }
    } else {
      /**
       *  a b c d   q 3 w r   f s
       *  a b c d   1 2 4 3   f s
       *  中间的部分就要乱序比对了
       *
       */
      // 乱序比较 ， 需要尽可能复用  用新的元素做成一个映射表去老的里找，一样的就复用， 不一样的要不插入 要不删除

      let s1 = i;
      let s2 = i;

      // vue3 用的是新的做的映射表 vue2 用的是老的做的映射表
      const keyToNewIndexMap = new Map();

      for (let i = s2; i <= e2; i++) {
        const childVNode = c2[i]; // child
        keyToNewIndexMap.set(childVNode.key, i);
      }

      const toBePatched = e2 - s2 + 1;
      const newIndexToOldIndexMap = new Array(toBePatched).fill(0);

      // 去老的里面查找 看用没有复用的
      for (let i = s1; i <= e1; i++) {
        const oldVnode = c1[i];
        let newIndex = keyToNewIndexMap.get(oldVnode.key);
        if (newIndex === undefined) {
          // 旧 children 里面的 节点 不在新 children 中，移除旧的节点
          unmount(oldVnode);
        } else {
          // 新老的比对 , 比较完毕后位置有差异
          newIndexToOldIndexMap[newIndex - s2] = i + 1;
          patch(oldVnode, c2[newIndex], el);
        }
      }

      // 最后就是移动节点，并且将新增的节点插入
      // 最长递增子序列

      let increasingNewIndexSequence = getSequence(newIndexToOldIndexMap);

      let j = increasingNewIndexSequence.length - 1; // 取出最后一个人的索引
      for (let i = toBePatched - 1; i >= 0; i--) {
        let currentIndex = i + s2; // 找到h的索引
        let child = c2[currentIndex]; // 找到h对应的节点
        let anchor =
          currentIndex + 1 < c2.length ? c2[currentIndex + 1].el : null; // 第一次插入h 后 h是一个虚拟节点，同时插入后 虚拟节点会

        if (newIndexToOldIndexMap[i] == 0) {
          // 如果自己是0说明没有被patch过
          patch(null, child, el, anchor);
        } else {
          // [1,2,3,4,5,6]
          // [1,6,2,3,4,5]  // 最长递增子序列
          // 这种操作 需要将节点全部的移动一遍， 我希望可以尽可能的少移动   [5,3,4,0]
          // 3 2 1 0
          // [1,2]    2
          if (i != increasingNewIndexSequence[j]) {
            hostInsert(child.el, el, anchor); // 操作当前的d 以d下一个作为参照物插入
          } else {
            j--; // 跳过不需要移动的元素， 为了减少移动操作 需要这个最长递增子序列算法
          }
        }
      }
    }
  };

  const patchChildren = (n1, n2, el) => {
    const c1 = n1.children; // 新子节点
    const c2 = n2.children; // 旧子节点

    // 新旧儿子节点的标识
    const prevShapeFlag = n1.shapeFlag;
    const shapeFlag = n2.shapeFlag;

    // 新节点是文本节点
    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      // 旧的节点有多个文件
      if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        // 销毁旧的子节点
        unmountChildren(c1);
      }
      // 新旧都是文本节点
      if (c2 !== c1) {
        hostSetElementText(el, c2);
      }
    } else {
      // 旧节点是数组
      if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        // 新节点也是数组
        if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
          // 新旧节点都是数组，进行 diff 比对
          patchKeyedChildren(c1, c2, el);
        } else {
          // 新节点无子节点，则移除旧节点的子节点
          unmountChildren(c1);
        }
      } else {
        // 旧节点是文本，则移除旧的文本节点
        if (prevShapeFlag & ShapeFlags.TEXT_CHILDREN) {
          hostSetElementText(el, "");
        }
        // 挂载新的数组节点
        if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
          mountChildren(c2, el);
        }
      }
    }
  };

  const patchElement = (n1, n2, container) => {
    let el = (n2.el = n1.el);

    // 更新属性  更新儿子
    const oldProps = n1.props || {};
    const newProps = n2.props || {};

    patchProps(oldProps, newProps, el);

    patchChildren(n1, n2, el);
  };

  // 更新
  const processElement = (n1, n2, container, anchor) => {
    if (n1 == null) {
      mountElement(n2, container);
    } else {
      // 元素更新
      patchElement(n1, n2, container);
    }
  };

  // 处理文本节点
  const processText = (n1, n2, container) => {
    if (n2 == null) {
      hostInsert((n2.el = hostCreateText(n2.children)), container);
    }
  };

  const isSameVNodeType = (n1, n2) => {
    return n1.type === n2.type && n1.key === n2.key;
  };

  const unmount = (n1) => {
    // 如果是组件 调用的组件的生命周期等

    hostRemove(n1.el);
  };

  // 派发更新 dom 节点
  const patch = (n1, n2, container, anchor = null) => {
    const { shapeFlag, type } = n2;

    if (n1 && !isSameVNodeType(n1, n2)) {
      // 把以前的删掉 换成n2
      anchor = hostNextSibling(n1.el);
      unmount(n1);
      n1 = null; // 重新渲染n2 对应的内容
    }

    switch (type) {
      case Text:
        processText(n1, n2, container);
        break;

      default:
        if (shapeFlag & ShapeFlags.ELEMENT) {
          processElement(n1, n2, container, anchor);
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

function getSequence(arr) {
  // 最终的结果是索引
  const len = arr.length;
  const result = [0]; // 索引  递增的序列 用二分查找性能高
  const p = arr.slice(0); // 里面内容无所谓 和 原本的数组相同 用来存放索引
  let start;
  let end;
  let middle;
  for (let i = 0; i < len; i++) {
    // O(n)
    const arrI = arr[i];
    if (arrI !== 0) {
      let resultLastIndex = result[result.length - 1];
      // 取到索引对应的值
      if (arr[resultLastIndex] < arrI) {
        p[i] = resultLastIndex; // 标记当前前一个对应的索引
        result.push(i);
        // 当前的值 比上一个人大 ，直接push ，并且让这个人得记录他的前一个
        continue;
      }
      // 二分查找 找到比当前值大的那一个
      start = 0;
      end = result.length - 1;
      while (start < end) {
        // 重合就说明找到了 对应的值  // O(logn)
        middle = ((start + end) / 2) | 0; // 找到中间位置的前一个
        if (arr[result[middle]] < arrI) {
          start = middle + 1;
        } else {
          end = middle;
        } // 找到结果集中，比当前这一项大的数
      }
      // start / end 就是找到的位置
      if (arrI < arr[result[start]]) {
        // 如果相同 或者 比当前的还大就不换了
        if (start > 0) {
          // 才需要替换
          p[i] = result[start - 1]; // 要将他替换的前一个记住
        }
        result[start] = i;
      }
    }
  }
  let len1 = result.length; // 总长度
  let last = result[len1 - 1]; // 找到了最后一项
  while (len1-- > 0) {
    // 根据前驱节点一个个向前查找
    result[len1] = last;
    last = p[last];
  }
  return result;
}
