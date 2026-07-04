// Keep-alive Web Worker
// Web Workers are less aggressively throttled than the main thread on mobile browsers.
// This worker sends periodic pings to the main thread to help keep it responsive
// even when the screen is off or the browser is in the background.

let intervalId = null;

self.onmessage = function (e) {
  if (e.data === "start") {
    if (intervalId) clearInterval(intervalId);
    // Ping every 5 seconds to keep the main thread responsive
    intervalId = setInterval(() => {
      self.postMessage("ping");
    }, 5000);
  } else if (e.data === "stop") {
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
  }
};
