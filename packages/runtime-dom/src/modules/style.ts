export const patchStyle = (el, prev, next) => {
  const style = el.style;

  if (next == null) {
    el.removeAttribute("style");
  } else {
    // 旧的里面有，新的里面没有，把旧的样式移除
    if (prev) {
      for (let key in prev) {
        if (next[key] == null) {
          style[key] = "";
        }
      }
    }

    for (const key in next) {
      style[key] = next[key];
    }

    // 这里为啥不直接把旧的样式全部清空，然后 新的覆盖旧的呢？像这样：
    /**
     * el.style = {}
     * for (const key in next) {
     *  style[key] = next[key];
     * }
     */

    // 因为直接这样修改 dom 的样式不会生效。el.style 是一个 CSSStyleDeclaration 对对象，所以只能通过 "diff" 的形式修改
  }
};
