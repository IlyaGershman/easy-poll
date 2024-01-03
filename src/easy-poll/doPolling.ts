import { Options } from './core/createPolling';
import { createPolling } from './core/createPolling';

/**
 * @description
 * this function allows you to do polling with retries and errors count.
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
 *  // onComplete will be called after polling is completed
 *  onComplete: ({ data, attempt, errorsCount }) => {},
 *  // polling will be stopped if breakIf is true.
 *  // This is useful when you want to stop polling if you know that you will never get the result you want.
 *  breakIf: data => data.received !== total,
 *  // onBreak will be called if breakIf is true
 *  onBreak: ({ data, attempt, errorsCount }) => {},
 *  //breakIfError acts the same as breakIf, but for errors. It is useful when you want to stop polling if you receive a specific error type.
 *  breakIfError: ({ error }) => error.code === 404,
 *  // onErrorBreak will be called if breakIfError is true
 *  onErrorBreak: ({ error, attempt, errorsCount }) => {},
 *  // onStart will be called before polling
 *  onStart: () => {},
 *  // onFinish will be called after polling is finished with whichever result
 *  onFinish: ({ data, attempt, errorsCount }) => {},
 *  // onNext will be called after each successful poll, except the last one
 *  onNext: ({ data, attempt, errorsCount }) => {},
 *  // onError will be called after each failed poll
 *  onError: ({ retry, errorsCount, error }) => {},
 *  // onTooManyAttempts will be called if maxPolls is reached.
 *  onTooManyAttempts: () => {},
 *  // onTooManyErrors will be called if maxErrors is reached.
 *  onTooManyErrors: ({ retry, errorsCount, error }) => {},
 *  // onIntervalError will be called if the interval function throws an error
 *  onIntervalError({ data, error, attempt ,attemptsDuration, errorsCount, duration }) => {}
 *  // abort can be used to stop polling from the outside at once. No more callbacks will be called.
 *  abort: ({data, error, attempt }) => data === 'I need your clothes, your boots, and your motorcycle',
 * );
 * @param fetcher
 * @param options - maxErrors, maxPolls, interval, until, onStart, onComplete, onNext, onError, onTooManyAttempts, onTooManyErrors
 * @returns-  {data, error } data is the result of the last successful request. error is the error of the last failed request.
 * @throws if maxErrors is less than 0
 * @throws if interval is less than 0
 */
export function doPolling<T>(fetcher: () => Promise<T>, options?: Options<T>) {
  return createPolling<T>(fetcher, options).poll();
}
