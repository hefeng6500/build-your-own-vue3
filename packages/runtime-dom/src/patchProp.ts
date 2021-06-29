import { patchAttr } from "./modules/attr";
import { patchClass } from "./modules/class";
import { patchEvent } from "./modules/events";
import { patchStyle } from "./modules/style";

export const patchProp = (el, key, prevValue, nextValue) => {
  switch (key) {
    case "class":
      patchClass();
      break;
    case "style":
      patchStyle();
      break;
    default:
      // 正在匹配不是事件 就是是属性
      if (/^on[^a-z]/.test(key)) {
        patchEvent()
      } else {
        patchAttr()
      }
  }
};
