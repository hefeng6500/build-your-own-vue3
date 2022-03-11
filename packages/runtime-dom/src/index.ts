import { createRenderer } from "@vue/runtime-core";
import { extend } from "@vue/shared";
import { nodeOps } from "./nodeOps";
import { patchProp } from "./patchProp";

const rendererOptions = extend({ patchProp }, nodeOps);

export function createApp(rootComponent, rootProps = null) {
  const app = createRenderer(rendererOptions).createApp(
    rootComponent,
    rootProps
  );

  let { mount } = app;
  app.mount = function (container) {
    container = nodeOps.querySelector(container);

    container.innerHTML = "";
    mount(container);
  };

  return app;
}

export * from "@vue/runtime-core";

