import { generateUniqueKey } from './generateUniqueKey';

export function createSubscribers<P>() {
  const subscribers: Record<string, (props?: P) => void> = {};

  const subscribe = (callback: (props: P) => void, key?: string) => {
    const resultKey = generateUniqueKey(key);
    subscribers[resultKey] = callback;

    return {
      unsubscribe: () => {
        delete subscribers[resultKey];
      },
    };
  };

  const notify = (props: P) => {
    Object.values(subscribers).forEach(cb => cb(props));
  };
  return { notify, subscribe };
}
