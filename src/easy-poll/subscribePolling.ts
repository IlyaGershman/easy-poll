import { EVENTS } from './consts/events';
import { createPolling, PureOptions, Reactions } from './createPolling';
import { createSubscribers } from '../utils/subscribers';
import { ReactionsProps } from '../easy-poll/createPolling';

/**
 * @description
 * this function allows you to subscribe to the polling with retries and errors count.
 * It is useful when you want to keep going with the request until you get the result you want or until you reach the max retries or max errors count.
 * @example
 * const { error, data, attempt, attemptsDuration, duration, errorsCount } = await doPolling(fetchStuff, {
 *  // max retries count. If maxPolls is reached, onTooManyAttempts will be called
 *  maxPolls: 10,
 *  // max errors count. If maxErrors is reached, onTooManyErrors will be called
 *  maxErrors: 5,
 *  // interval between retries. Can be a number or function that is called on every poll
 *  interval: 1000,
 *  // polling will be stopped if condition is true. If condition is not provided,
 *  // polling will be stopped after one successful request
 *  until: data => data.status === 'SUCCESS',
 *  // polling will be stopped if breakIf is true.
 *  // This is useful when you want to stop polling if you know that you will never get the result you want.
 *  breakIf: data => data.received !== total,
 * );
 * @param fetcher
 * @param options - maxErrors, maxPolls, interval, until, breakIf
 * @returns-  {subscribe }
 * @throws if maxErrors is less than 0
 * @throws if interval is less than 0
 */
export function subscribePolling<T>(fetcher: () => Promise<T>, pureOptions?: PureOptions<T>) {
  const { notify, subscribe } = createSubscribers<ReactionsProps<T>>();

  const subscribtionOptions: Reactions<T> = {
    onStart: () => {
      notify({ event: EVENTS.ON_START });
    },
    onFinish: props => {
      notify({ event: EVENTS.ON_FINISH, props });
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
