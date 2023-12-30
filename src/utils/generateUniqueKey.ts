const PREFIX = 'EASY_POLL';
export const generateUniqueKey = (prefix: string = PREFIX) => {
  const id = Math.random().toString(16).slice(2);
  return `${prefix}_${id}`;
};
