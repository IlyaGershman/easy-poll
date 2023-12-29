import { isTest } from '../utils/envs';
import { createTimer } from '../utils/timers';
import { wait } from '../utils/wait';

export type SuccessProps<T> = ReturnType<ReturnType<typeof createState<T>>['getSuccessState']>;
export type ErrorProps<T> = ReturnType<ReturnType<typeof createState<T>>['getErrorState']>;
export type State<T> = ReturnType<ReturnType<typeof createState<T>>['getState']>;
export type ReactionsProps<T> = SuccessProps<T> | ErrorProps<T> | State<T>;

export type Reactions<T> = {
  onStart?: () => void;
  onFinish?: (props: State<T>) => void;
  onComplete?: (props: SuccessProps<T>) => void;
  onBreak?: (props: SuccessProps<T>) => void;
  onNext?: (props: SuccessProps<T>) => void;
  onTooManyAttempts?: (props: SuccessProps<T>) => void;
  onError?: (props: ErrorProps<T>) => void;
  onTooManyErrors?: (props: ErrorProps<T>) => void;
  onIntervalError?: (props: State<T> & { newInterval: number }) => void;
};

export type PureOptions<T> = {
  maxErrors?: number;
  maxPolls?: number;
  interval?: ((props: State<T>) => number) | number;
  until?: (props: SuccessProps<T>) => boolean;
  breakIf?: (props: SuccessProps<T>) => boolean;
};

export type Options<T> = PureOptions<T> & Reactions<T>;

export const POLLING_INTERVAL = 2000;
export const MAX_ERRORS = 5;

export function createPolling<T>(fetcher: () => Promise<T>, options?: Options<T>) {
  const {
    maxErrors = MAX_ERRORS,
    maxPolls = isTest() ? 5 : Infinity,
    interval = isTest() ? 1 : POLLING_INTERVAL,
    until = () => true,
    breakIf = () => false,
    onBreak = () => {},
    onStart = () => {},
    onFinish = () => {},
    onComplete = () => {},
    onNext = () => {},
    onError = () => {},
    onTooManyAttempts = () => {},
    onTooManyErrors = () => {},
    onIntervalError = () => {},
  } = validateOptions(options);

  var { getSuccessState, getErrorState, getState, onNewData, onNewCatch } = createState<T>();

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

  const getIsTooManyAttempts = () => getState().attempt >= maxPolls;
  const getIsTooManyErrors = () => getState().errorsCount >= maxErrors;

  const poll = async () => {
    await wait(4);
    onStart();

    while (true) {
      try {
        const data = await fetcher();
        onNewData(data);

        if (breakIf(getSuccessState())) {
          onBreak(getSuccessState());
          break;
        }

        if (until(getSuccessState())) {
          onComplete(getSuccessState());
          break;
        }

        if (getIsTooManyAttempts()) {
          onTooManyAttempts(getSuccessState());
          break;
        }

        const { isValid, newInterval } = getInterval();
        if (!isValid) {
          break;
        }

        onNext(getSuccessState());

        await wait(newInterval);
      } catch (e) {
        onNewCatch(e);

        onError(getErrorState());

        if (getIsTooManyErrors()) {
          onTooManyErrors(getErrorState());
          break;
        }

        const { isValid, newInterval } = getInterval();
        if (!isValid) {
          break;
        }

        await wait(newInterval);
      }
    }

    onFinish(getState());

    return getState();
  };

  return { poll };
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

function createState<T>() {
  const timer = createTimer();

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

  const onNewData = (d: T) => {
    onNewAttempt();
    data = d;
    error = null;
  };

  const onNewCatch = (e: any) => {
    onNewAttempt();
    error = e;
    data = null;
    errorsCount += 1;
  };

  return { errorsCount, attempt, getSuccessState, getErrorState, getState, onNewData, onNewCatch };
}
