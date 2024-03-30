export const abortablePromise = <T>(promise: Promise<T>, signal: AbortSignal): Promise<T> => {
  return new Promise((resolve, reject) => {
    if (signal.aborted) {
      reject(signal.reason);
      return;
    }

    const abortRejection = () => {
      reject(signal.reason);
    };

    promise
      .then(resolve)
      .catch(reject)
      .finally(() => {
        signal.removeEventListener('abort', abortRejection);
      });

    signal.addEventListener('abort', abortRejection);
  });
};
