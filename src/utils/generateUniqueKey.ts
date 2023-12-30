import * as crypto from 'crypto';

const PREFIX = 'EASY_POLL';
export const generateUniqueKey = (prefix: string = PREFIX) => {
  const id = crypto?.randomUUID() || Math.random().toString(16).slice(2);
  return `${prefix}_${id}`;
};
