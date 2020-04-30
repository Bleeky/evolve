import MyRBush from 'utils/myRBush';
import knn from 'rbush-knn';

let pause;

let moveInterval;
let changeDirectionInterval;
let looseLifeInterval;

// let tree;
let blob;
let objectives = {};

self.addEventListener('message', (e) => {
  switch (e.data.type) {
    case 'update':
    {
      // tree = new MyRBush();
      // tree = tree.load(e.data.tree);
      blob = e.data.blob;
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
      clearInterval(looseLifeInterval);
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

moveInterval = setInterval(() => {
  if (!pause) {
    self.postMessage({ type: 'move', blob });
  }
}, 50);

changeDirectionInterval = setInterval(() => {
  if (!pause && !Object.keys(objectives).length) self.postMessage({ type: 'changeDirection', blob });
}, 2000);

looseLifeInterval = setInterval(() => {
  if (!pause) self.postMessage({ type: 'looseLife', blob });
}, 2000);
