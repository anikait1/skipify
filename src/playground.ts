function poller(poll) {
  let timerID;

  function run() {
    console.log('run')
    poll();
    timerID = setTimeout(run, 1000);
    console.log('run', timerID)
  }

  run();

  return {
    poll,
    clear: () => {
      clearTimeout(timerID);
    },
    timerID,
  };
}

function foo() {
  console.log("foo");
}

const p = poller(foo);
let count = 5;

const interval = setInterval(() => {
  if (count <= 0) {
    clearInterval(interval);
    p.clear();
    return;
  }

  console.log(p.timerID);
  count -= 1;
}, 2000);
