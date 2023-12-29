import { generateUniqueKey } from './generateUniqueKey';
import { EVENTS } from '../easy-poll/consts/events';

type NotifyProps<P> = { event: keyof typeof EVENTS; props?: P };
type SubscriptionCallback<P> = (props?: NotifyProps<P>) => void;
type Subscribers<P> = Record<string, SubscriptionCallback<P>>;

export function createSubscribers<P>() {
  const subscribers: Subscribers<P> = {};

  const subscribe = (callback: (props: NotifyProps<P>) => void, key?: string) => {
    const resultKey = generateUniqueKey(key);
    subscribers[resultKey] = callback;

    return {
      unsubscribe: () => {
        delete subscribers[resultKey];
      },
    };
  };

  const notify = (props: NotifyProps<P>) => {
    Object.values(subscribers).forEach(cb => cb(props));
  };
  return { notify, subscribe };
}
