import { isTest } from '../../utils/envs';
import { wait } from '../../utils/wait';
import { createState } from './state';
import { validateOptions } from './validateOptions';

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
  onIntervalError?: (props: State<T>) => void;
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

  const state = createState<T>();

  const getInterval = () => {
    if (typeof interval === 'number') return { isValid: true, newInterval: interval };

    const badInterval = { isValid: false, newInterval: 0 };
    try {
      const newInterval = interval(state.get.all());

      if (typeof newInterval !== 'number' || newInterval < 0) {
        throw new Error('interval must be greater than or equal to 0');
      }

      return { isValid: true, newInterval };
    } catch (error) {
      state.on.intervalCatch(error);
      return badInterval;
    }
  };

  const getIsTooManyAttempts = () => state.get.attempt() >= maxPolls;
  const getIsTooManyErrors = () => state.get.errorsCount() >= maxErrors;

  const poll = async () => {
    await wait(4);
    onStart();

    while (true) {
      try {
        const data = await fetcher();
        state.on.newData(data);

        if (breakIf(state.get.success())) {
          onBreak(state.get.success());
          break;
        }

        if (until(state.get.success())) {
          onComplete(state.get.success());
          break;
        }

        if (getIsTooManyAttempts()) {
          onTooManyAttempts(state.get.success());
          break;
        }

        const { isValid, newInterval } = getInterval();
        if (!isValid) {
          onIntervalError(state.get.all());
          break;
        }

        onNext(state.get.success());

        await wait(newInterval);
      } catch (e) {
        state.on.newCatch(e);

        onError(state.get.catch());

        if (getIsTooManyErrors()) {
          onTooManyErrors(state.get.catch());
          break;
        }

        const { isValid, newInterval } = getInterval();
        if (!isValid) {
          onIntervalError(state.get.all());
          break;
        }

        await wait(newInterval);
      }
    }

    onFinish(state.get.all());

    return state.get.all();
  };

  return { poll };
}