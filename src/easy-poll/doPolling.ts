import { Fetcher, Options } from './core/createPolling';
import { createPolling } from './core/createPolling';

/**
 * @description
 * this function allows you to do polling with retries and errors count.
 * It is useful when you want to keep going with the request until you get the result you want or until you reach the max retries or max errors count.
 * @example
 * const { init, abort } = await doPolling(fetchStuff,
 *   {
 *     // max retries count. If maxPolls is reached, onTooManyAttempts will be called
 *     maxPolls: 10, // default is Infinity
 *     // max errors count. If maxErrors is reached, onTooManyErrors will be called
 *     maxErrors: 5, // default is 5
 *     // interval between retries. Can be a number or function that is called on every poll
 *     interval: 1000, // default is 2000
 *     // polling will be stopped if condition is true. If condition is not provided, polling will be stopped after one successful request
 *     until: ({ data }) => data.status === 'SUCCESS', // default is () => true
 *     // onStart will be called before polling
 *     onStart: () => {},
 *     // onNext will be called after each successful poll, except the last one
 *     onNext: ({ data, attempt, errorsCount }) => {},
 *     // onComplete will be called after polling is completed
 *     onComplete: ({ data, attempt, errorsCount }) => {},
 *     // onFinish will be called after polling is finished with whichever result
 *     onFinish: ({ data, attempt, errorsCount }) => {},
 *     // onError will be called after each failed poll
 *     onError: ({ retry, errorsCount, error }) => {},
 *     // onTooManyAttempts will be called if maxPolls is reached.
 *     onTooManyAttempts: () => {},
 *     // onTooManyErrors will be called if maxErrors is reached.
 *     onTooManyErrors: ({ retry, errorsCount, error }) => {},
 *     // onIntervalError will be called if the interval function throws an error
 *     onIntervalError({ data, error, attempt, attemptsDuration, errorsCount, duration }) => {}
 *     // polling will be stopped if breakIf is true. This is useful when you want to stop polling if you know that you will never get the result you want.
 *     breakIf: ({ data }) => data.received !== total,
 *     // onBreak will be called if breakIf is true
 *     onBreak: ({ data, attempt, errorsCount }) => {},
 *     // breakIfError acts the same as breakIf, but for errors. It is useful when you want to stop polling if you receive a specific error type.
 *     breakIfError: ({ error }) => error.code === 404,
 *     // onBreakError will be called if breakIfError is true
 *     onBreakError: ({ error, attempt, errorsCount }) => {},
 *   }
 * );
 *
 * // now simple call init to start polling
 * init().then(({ error, data }: {data: T}) => {
 *   // do something with the result
 * });
 *
 * // you can also abort the polling from the outside
 * addEventListener('click', abort);
 * @throws if maxErrors is less than 0
 * @throws if interval is less than 0 or not a function
 * @throws if passed callbacks are not functions
 */
export function doPolling<T>(fetcher: Fetcher<T>, options?: Options<T>) {
  const { init, abort } = createPolling<T>(fetcher, options);
  return { init: () => init(), abort: () => abort() };
}
