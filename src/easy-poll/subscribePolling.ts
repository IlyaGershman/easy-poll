import { Fetcher, PureOptions, Reactions } from './core/createPolling';
import { createPolling } from './core/createPolling';
import { createSubscribers } from '../utils/subscribers';
import { ReactionsProps } from './core/createPolling';
import { validateOptions } from './core/validateOptions';

/**
 * @description
 * this function allows you to subscribe to the polling with retries and errors count.
 * It is useful when you want to keep going with the request until you get the result you want or until you reach the max retries or max errors count.
 * @example
 * // someService.ts
 * import { subscribePolling } from '@ilyagershman/easy-poll';
 *
 * export const { subscribe, init, abort } = subscribePolling(fetchStuff, {
 *   // max retries count. If maxPolls is reached, onTooManyAttempts will be called
 *   maxPolls: 10,
 *   // max errors count. If maxErrors is reached, onTooManyErrors will be called
 *   maxErrors: 5,
 *   // interval between retries. Can be a number or function that is called on every poll
 *   interval: () => getRandomInt(10000),
 *   // polling will be stopped if the condition is true. If the condition is not provided,
 *   // polling will be stopped after one successful request
 *   until: ({ data }) => data.status === 'SUCCESS',
 *   // polling will be stopped if breakIf is true.
 *   // This is useful when you want to stop polling if you know that you will never get the result you want.
 *   breakIf: ({ data }) => data.received !== total,
 *   // breakIfError acts the same as breakIf, but for errors. It is useful when you want to stop polling if you receive a specific error type.
 *   breakIfError: ({ error }) => error.code === 404,
 * });
 *
 * /// somewhere.ts in your code react on the polling events.
 * import { subscribe, init } from './somewhere';
 * import { EVENTS } from '@ilyagershman/easy-poll';
 *
 * init().then({ data, error } => {
 *   // same as doPolling
 * }));
 *
 * subscribe(props => {
 *   if (props.event === EVENTS.ON_COMPLETE) onComplete(props);
 *   if (props.event === EVENTS.ON_BREAK) onBreak(props);
 *   if (props.event === EVENTS.ON_NEXT) onNext(props);
 *   if (props.event === EVENTS.ON_ERROR) onError(props);
 *   if (props.event === EVENTS.ON_FINISH) onFinish(props);
 *   if (props.event === EVENTS.ON_TOOMANYERRORS) onTooManyErrors(props);
 *   if (props.event === EVENTS.ON_TOOMANYATTEMPTS) onTooManyAttempts(props);
 *   // ...
 * });
 *
 * /// somewhereElse.ts in your code react on the polling events.
 * import { abort } from './somewhere';
 *
 * // this will abort the polling after some time
 * setTimeout(abort, 4200);
 */
export function subscribePolling<T>(fetcher: Fetcher<T>, pureOptions?: PureOptions<T>) {
  const { notify, subscribe } = createSubscribers<{ event: keyof typeof EVENTS; props?: ReactionsProps<T> }>();

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
    onNext: props => {
      notify({ event: EVENTS.ON_NEXT, props });
    },
    onError: props => {
      notify({ event: EVENTS.ON_ERROR, props });
    },
    onTooManyAttempts: props => {
      notify({ event: EVENTS.ON_TOOMANYATTEMPTS, props });
    },
    onBreak: props => {
      notify({ event: EVENTS.ON_BREAK, props });
    },
    onErrorBreak: props => {
      notify({ event: EVENTS.ON_ERRORBREAK, props });
    },
    onTooManyErrors: props => {
      notify({ event: EVENTS.ON_TOOMANYERRORS, props });
    },
    onIntervalError: props => {
      notify({ event: EVENTS.ON_INTERVALERROR, props });
    },
  };

  const options = validateOptions({ ...pureOptions, ...subscribtionOptions });

  const { init, abort } = createPolling<T>(fetcher, options);

  return { subscribe, init: () => init(), abort: () => abort() };
}

export const EVENTS = {
  ON_START: 'ON_START',
  ON_BREAK: 'ON_BREAK',
  ON_FINISH: 'ON_FINISH',
  ON_COMPLETE: 'ON_COMPLETE',
  ON_NEXT: 'ON_NEXT',
  ON_TOOMANYATTEMPTS: 'ON_TOOMANYATTEMPTS',
  ON_ERROR: 'ON_ERROR',
  ON_ERRORBREAK: 'ON_ERRORBREAK',
  ON_TOOMANYERRORS: 'ON_TOOMANYERRORS',
  ON_INTERVALERROR: 'ON_INTERVALERROR',
} as const;
