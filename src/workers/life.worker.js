import { BASE_LOSE_LIFE, BASE_LIFE } from 'utils/consts';

let pause;

let moveInterval;
let changeDirectionInterval;
let loseLifeInterval;

let blob;
let objectives = {};

self.addEventListener('message', (e) => {
  switch (e.data.type) {
    case 'update':
    {
      blob = e.data.blob;
      moveInterval = setInterval(() => {
        if (!pause) {
          self.postMessage({ type: 'move', blob });
        }
      }, blob.speed);
      loseLifeInterval = setInterval(() => {
        if (!pause) self.postMessage({ type: 'looseLife', blob });
      }, ((blob.life * BASE_LOSE_LIFE) / BASE_LIFE));
      break;
    }
    case 'addObjective': {
      if (!objectives[e.data.objective.uuid]) {
        objectives = { ...objectives, [e.data.objective.uuid]: e.data.objective };
      }
      break;
    }
    case 'removeObjective': {
      if (objectives[e.data.objective.uuid]) {
        delete objectives[e.data.objective.uuid];
      }
      break;
    }
    case 'kill': {
      clearInterval(moveInterval);
      clearInterval(changeDirectionInterval);
      clearInterval(loseLifeInterval);
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

changeDirectionInterval = setInterval(() => {
  if (!pause && !Object.keys(objectives).length) self.postMessage({ type: 'changeDirection', blob });
}, 3000);
