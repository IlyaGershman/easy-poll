import { EVENTS } from './consts/events';
import { createPolling, PureOptions, Reactions } from './createPolling';
import { createSubscribers } from '../utils/subscribers';

export function subscribePolling<T>(fetcher: () => Promise<T>, pureOptions?: PureOptions<T>) {
  const { notify, subscribe } = createSubscribers<T>();

  const subscribtionOptions: Reactions<T> = {
    onStart: () => {
      notify({ event: EVENTS.ON_START });
    },
    onFinish: () => {
      notify({ event: EVENTS.ON_FINISH });
    },
    onComplete: props => {
      notify({ event: EVENTS.ON_COMPLETE, props });
    },
    onBreak: props => {
      notify({ event: EVENTS.ON_BREAK, props });
    },
    onNext: props => {
      notify({ event: EVENTS.ON_NEXT, props });
    },
    onTooManyAttempts: props => {
      notify({ event: EVENTS.ON_TOOMANYATTEMPTS, props });
    },
    onError: props => {
      notify({ event: EVENTS.ON_ERROR, props });
    },
    onTooManyErrors: props => {
      notify({ event: EVENTS.ON_TOOMANYERRORS, props });
    },
    onIntervalError: props => {
      notify({ event: EVENTS.ON_INTERVALERROR, props });
    },
  };

  const poll = createPolling<T>(fetcher, { ...pureOptions, ...subscribtionOptions }).poll();

  return { subscribe, poll };
}
