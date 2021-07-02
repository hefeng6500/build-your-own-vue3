import { createVNode } from "./vnode";

export function createAppApi(render) {
  return function createApp(rootComponent, rootProps) {
    const app = {
      _props: rootProps,
      _component: rootComponent,
      _container: null,

      mount(container) {
        // 1. 创建虚拟节点
        const vnode = createVNode(rootComponent, rootProps);

        // 2. 将虚拟节点渲染到 container 中
        render(vnode, container);
      },
    };

    return app;
  };
}
