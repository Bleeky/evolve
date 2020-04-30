let matingRequests;

self.addEventListener('message', (e) => {
  matingRequests = e.data;
  Object.keys(matingRequests).forEach((requestKey) => {
    if (matingRequests[`${requestKey.split('.')[1]}.${requestKey.split('.')[0]}`]) {
      self.postMessage({ type: 'birth', newborn: matingRequests[requestKey], mates: requestKey });
    }
  });
}, false);
