import { createAppApi } from "./apiCreateApp";

export function createRenderer(rendererOptions) {
  const render = () => {};
  
  return {
    createApp: createAppApi(render),
  };
}
