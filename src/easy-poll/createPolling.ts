import { isTest } from '../utils/envs';
import { createTimer } from '../utils/timers';
import { wait } from '../utils/wait';

type SuccessProps<T> = ReturnType<ReturnType<typeof createPolling<T>>['getSuccessState']>;
type ErrorProps<T> = ReturnType<ReturnType<typeof createPolling<T>>['getErrorState']>;
type State<T> = ReturnType<ReturnType<typeof createPolling<T>>['getState']>;

export type Options<T> = {
  maxErrors?: number;
  maxPolls?: number;
  interval?: ((props: State<T>) => number) | number;
  until?: (data: T) => boolean;
  breakIf?: (data: T) => boolean;
  onBreak?: (props: SuccessProps<T>) => void;
  onStart?: () => void;
  onComplete?: (props: SuccessProps<T>) => void;
  onNext?: (props: SuccessProps<T>) => void;
  onTooManyRetries?: (props: SuccessProps<T>) => void;
  onError?: (props: ErrorProps<T>) => void;
  onTooManyErrors?: (props: ErrorProps<T>) => void;
  onIntervalError?: (props: State<T> & { newInterval: number }) => void;
};

export const POLLING_INTERVAL = 2000;
export const MAX_ERRORS = 5;

export function createPolling<T>(fetcher: () => Promise<T>, options?: Options<T>) {
  const timer = createTimer();

  const {
    maxErrors = MAX_ERRORS,
    maxPolls = isTest() ? 5 : Infinity,
    interval = isTest() ? 1 : POLLING_INTERVAL,
    until = () => true,
    breakIf = () => false,
    onBreak = () => {},
    onStart = () => {},
    onComplete = () => {},
    onNext = () => {},
    onError = () => {},
    onTooManyRetries = () => {},
    onTooManyErrors = () => {},
    onIntervalError = () => {},
  } = validateOptions(options);

  let data: T | null = null;
  let attempt = 0;
  let attemptsDuration: number[] = [];
  let error = null;
  let errorsCount = 0;

  const getCommonState = () => ({
    attempt,
    attemptsDuration,
    errorsCount,
    duration: timer.duration(),
  });

  const getSuccessState = () => ({
    ...getCommonState(),
    data,
  });

  const getErrorState = () => ({
    ...getCommonState(),
    error,
  });

  const getState = () => ({
    ...getCommonState(),
    data,
    error,
  });

  const onNewAttempt = () => {
    attempt += 1;
    attemptsDuration.push(timer.duration());
  };

  const onNewCatch = (e: any) => {
    error = e;
    data = null;
    errorsCount += 1;
  };

  const onNewData = (d: T) => {
    data = d;
    error = null;
  };

  const handleBreak = () => {
    onBreak(getSuccessState());
  };

  const handleComplete = () => {
    onComplete(getSuccessState());
  };

  const handleNext = () => {
    onNext(getSuccessState());
  };

  const handleTooManyRetries = () => {
    onTooManyRetries(getSuccessState());
  };

  const handleError = () => {
    onError(getErrorState());
  };

  const handleTooManyErrors = () => {
    onError(getErrorState());
    onTooManyErrors(getErrorState());
  };

  const getInterval = () => {
    if (typeof interval === 'function') {
      const newInterval = interval(getState());

      if (typeof newInterval !== 'number' || newInterval < 0) {
        onIntervalError({ ...getState(), newInterval });
        return { isValid: false, newInterval: 0 };
      }

      return { isValid: true, newInterval };
    }

    if (typeof interval === 'number') return { isValid: true, newInterval: interval };
  };

  const getIsTooManyErrors = () => errorsCount >= maxErrors;
  const getIsTooManyAttempts = () => attempt >= maxPolls;

  const poll = async () => {
    onStart();
    while (true) {
      onNewAttempt();
      try {
        const data = await fetcher();
        onNewData(data);

        if (breakIf(data)) {
          handleBreak();
          break;
        }

        if (until(data)) {
          handleComplete();
          break;
        }

        if (getIsTooManyAttempts()) {
          handleTooManyRetries();
          break;
        }

        const { isValid, newInterval } = getInterval();
        if (!isValid) {
          break;
        }

        handleNext();
        await wait(newInterval);
      } catch (e) {
        onNewCatch(e);

        if (getIsTooManyErrors()) {
          handleTooManyErrors();
          break;
        }

        handleError();

        const { isValid, newInterval } = getInterval();
        if (!isValid) {
          break;
        }

        await wait(newInterval);
      }
    }

    return getState();
  };

  return { poll, getSuccessState, getErrorState, getState };
}

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

  if (o.onComplete !== undefined && typeof o.onComplete !== 'function') {
    throw new Error('onComplete must be a function');
  }

  if (o.onNext !== undefined && typeof o.onNext !== 'function') {
    throw new Error('onNext must be a function');
  }

  if (o.onError !== undefined && typeof o.onError !== 'function') {
    throw new Error('onError must be a function');
  }

  if (o.onTooManyRetries !== undefined && typeof o.onTooManyRetries !== 'function') {
    throw new Error('onTooManyRetries must be a function');
  }

  if (o.onTooManyErrors !== undefined && typeof o.onTooManyErrors !== 'function') {
    throw new Error('onTooManyErrors must be a function');
  }

  if (o.onIntervalError !== undefined && typeof o.onIntervalError !== 'function') {
    throw new Error('onIntervalError must be a function');
  }

  return o;
};
