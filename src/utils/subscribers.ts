import { generateUniqueKey } from './generateUniqueKey';
import { EVENTS } from '../easy-poll/consts/events';
import { ReactionsProps } from '../easy-poll/createPolling';

type NotifyProps<T> = { event: keyof typeof EVENTS; props?: ReactionsProps<T> };
type SubscriptionCallback<T> = (props?: NotifyProps<T>) => void;
type Subscribers<T> = Record<string, SubscriptionCallback<T>>;

export function createSubscribers<T>() {
  const subscribers: Subscribers<T> = {};

  const subscribe = (callback: (props: NotifyProps<T>) => void, key?: string) => {
    const resultKey = generateUniqueKey(key);
    subscribers[resultKey] = callback;

    return {
      unsubscribe: () => {
        delete subscribers[resultKey];
      },
    };
  };

  const notify = (props: NotifyProps<T>) => {
    Object.values(subscribers).forEach(cb => cb(props));
  };
  return { notify, subscribe };
}
