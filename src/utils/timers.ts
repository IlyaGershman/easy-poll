export const createTimer = (start?: number) => {
  let startTime = start || Date.now();

  return {
    duration: () => Date.now() - startTime,
    reset: () => (startTime = Date.now()),
  };
};
