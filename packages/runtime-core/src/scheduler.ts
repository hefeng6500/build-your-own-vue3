let queue = [];
export function queueJob(job) {
  if (!queue.includes(job)) {
    queue.push(job);
    queueFlush();
  }
}
let isFlushPending = false;
function queueFlush() {
  if (!isFlushPending) {
    isFlushPending = true;
    Promise.resolve().then(flushJobs);
  }
}

function flushJobs() {
  debugger
  isFlushPending = false;
  // 清空时  我们需要根据调用的顺序依次刷新  , 保证先刷新父在刷新子
  queue.sort((a, b) => a.id - b.id);
  for (let i = 0; i < queue.length; i++) {
    const job = queue[i];
    job();
  }
  queue.length = 0;
}
