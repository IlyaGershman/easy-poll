const PREFIX = 'EASY_POLL';
export const generateUniqueKey = (prefix: string = PREFIX) => {
  const timestamp = Date.now();
  return `${prefix}_${timestamp}`;
};
