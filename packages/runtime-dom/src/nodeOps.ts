export const nodeOps = {
  // 创建元素
  createElement: (tagName) => document.createElement(tagName),
  // 移除元素
  remove: (child) => {
    const parent = child.parentNode;

    if (parent) {
      parent.removeChild(child);
    }
  },
  // 插入元素
  insert: (child, parent, anchor = null) => {
    parent.insertBofore(child, anchor);
  },
  // 查询元素
  querySelector: (selector) => document.querySelector(selector),
  // 设置元素文本
  setElementText: (el, text) => (el.textContent = text),
  // 创建文本
  createText: (text) => document.createTextNode(text),
  // 设置文本节点的值
  setText: (node, text) => (node.nodeValue = text),
};
