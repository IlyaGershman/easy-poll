import { abortablePromise } from './promises';

export const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const abortableWait = (ms: number, signal: AbortSignal) => {
  return abortablePromise(wait(ms), signal);
};
