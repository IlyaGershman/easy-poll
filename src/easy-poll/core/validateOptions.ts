import { Options } from './createPolling';

export const validateOptions = <T>(o?: Options<T>) => {
  if (o === undefined) {
    return {};
  }

  if (o.maxErrors !== undefined && o.maxErrors < 0) {
    throw new Error('maxErrors must be greater than or equal to 0');
  }

  if (o.maxPolls !== undefined && o.maxPolls < 0) {
    throw new Error('maxPolls must be greater than or equal to 0');
  }

  if (o.interval !== undefined && typeof o.interval === 'number' && o.interval < 0) {
    throw new Error('interval must be greater than or equal to 0');
  }

  if (o.interval !== undefined && typeof o.interval !== 'number' && typeof o.interval !== 'function') {
    throw new Error('interval must be a function or a number');
  }

  if (o.until !== undefined && typeof o.until !== 'function') {
    throw new Error('until must be a function');
  }

  if (o.breakIf !== undefined && typeof o.breakIf !== 'function') {
    throw new Error('breakIf must be a function');
  }

  if (o.onBreak !== undefined && typeof o.onBreak !== 'function') {
    throw new Error('onBreak must be a function');
  }

  if (o.onStart !== undefined && typeof o.onStart !== 'function') {
    throw new Error('onStart must be a function');
  }

  if (o.onFinish !== undefined && typeof o.onFinish !== 'function') {
    throw new Error('onFinish must be a function');
  }

  if (o.onComplete !== undefined && typeof o.onComplete !== 'function') {
    throw new Error('onComplete must be a function');
  }

  if (o.onNext !== undefined && typeof o.onNext !== 'function') {
    throw new Error('onNext must be a function');
  }

  if (o.onError !== undefined && typeof o.onError !== 'function') {
    throw new Error('onError must be a function');
  }

  if (o.onTooManyAttempts !== undefined && typeof o.onTooManyAttempts !== 'function') {
    throw new Error('onTooManyAttempts must be a function');
  }

  if (o.onTooManyErrors !== undefined && typeof o.onTooManyErrors !== 'function') {
    throw new Error('onTooManyErrors must be a function');
  }

  if (o.onIntervalError !== undefined && typeof o.onIntervalError !== 'function') {
    throw new Error('onIntervalError must be a function');
  }

  return o;
};
