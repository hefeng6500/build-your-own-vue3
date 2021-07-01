/**
 * 
 * 这里的 createInvoker 相当巧妙
 * 
 */

export const patchEvent = (el, key, value) => {
  const invokers = el._vei || (el._vei = {});
  const exists = invokers[key];

  if (value && exists) {
    exists.value = value;
  } else {
    const eventName = key.slice(2).toLowerCase();

    if (value) {
      let invoke = (invokers[key] = createInvoker(value));
      /**
       * 这里的 createInvoker 相当巧妙
       * exists = invokers[key] = createInvoker(value)  createInvoker(value) 返回的确实是一个函数， 
       * addEventListener 和 removeEventListener 监听的函数都是 真实的 函数，而不是函数身上的 .value();
       * addEventListener 监听到的时候执行的是：(e) => { invoke.value(e); } 执行的是 invoke.value(e) 而不是 value(e)
       * 
       * 这里借助 exists.value 保存目标函数，目标函数又作为监听和移除监听， exists.value 方式保存函数很巧妙，不然代码不好组织
       */
      el.addEventListener(eventName, invoke);
    } else {
      el.removeEventListener(eventName, exists);
      invokers[key] = undefined;
    }
  }
};

function createInvoker(value) {
  const invoke = (e) => {
    invoke.value(e);
  };

  invoke.value = value;
  return invoke;
}
