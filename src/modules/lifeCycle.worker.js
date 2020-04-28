let sharedArray;

self.addEventListener('message', (event) => {
  sharedArray = new Int32Array(event.data);
  console.error(sharedArray);
}, false);

setInterval(() => {
  Atomics.store(sharedArray, 0, 12);
}, 1500);
