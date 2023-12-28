export const createTimer = (start?: number) => {
  const startTime = start || Date.now();

  return {
    duration: () => Date.now() - startTime,
    reset: () => createTimer(),
  };
};
