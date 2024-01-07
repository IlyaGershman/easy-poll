export const abortablePromise = <T>(promise: Promise<T>, signal: AbortSignal): Promise<T> => {
  return new Promise((resolve, reject) => {
    if (signal.aborted) {
      reject(signal.reason);
      return;
    }

    promise.then(resolve).catch(reject);

    signal.addEventListener('abort', () => {
      reject(signal.reason);
    });
  });
};
