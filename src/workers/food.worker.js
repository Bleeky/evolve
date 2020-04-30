let foodInterval;
let pause;

self.addEventListener('message', (e) => {
  switch (e.data.type) {
    case 'kill': {
      clearInterval(foodInterval);
      self.close();
      break;
    }
    case 'pause': {
      pause = true;
      break;
    }
    case 'play': {
      pause = false;
      break;
    }
    default:
      break;
  }
}, false);

foodInterval = setInterval(() => {
  if (!pause) self.postMessage({ type: 'generateFood' });
}, 5000);
