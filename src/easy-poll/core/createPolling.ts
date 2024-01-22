import { isTest } from '../../utils/envs';
import { abortablePromise } from '../../utils/promises';
import { abortableWait, wait } from '../../utils/wait';
import { createPollState } from './state';
import { validateOptions } from './validateOptions';

export type SuccessProps<T> = ReturnType<ReturnType<typeof createPollState<T>>['get']['success']>;
export type ErrorProps<T> = ReturnType<ReturnType<typeof createPollState<T>>['get']['catch']>;
export type State<T> = ReturnType<ReturnType<typeof createPollState<T>>['get']['all']>;
export type ReactionsProps<T> = SuccessProps<T> | ErrorProps<T> | State<T>;

export type Reactions<T> = {
  onStart?: () => void;
  onFinish?: (props: State<T>) => void;
  onComplete?: (props: SuccessProps<T>) => void;
  onBreak?: (props: SuccessProps<T>) => void;
  onNext?: (props: SuccessProps<T>) => void;
  onTooManyAttempts?: (props: SuccessProps<T>) => void;
  onError?: (props: ErrorProps<T>) => void;
  onErrorBreak?: (props: ErrorProps<T>) => void;
  onTooManyErrors?: (props: ErrorProps<T>) => void;
  onIntervalError?: (props: State<T>) => void;
};

export type PureOptions<T> = {
  maxErrors?: number;
  maxPolls?: number;
  interval?: ((props: State<T>) => number) | number;
  until?: (props: SuccessProps<T>) => boolean;
  breakIf?: (props: SuccessProps<T>) => boolean;
  breakIfError?: (props: ErrorProps<T>) => boolean;
};

export type Options<T> = PureOptions<T> & Reactions<T>;
export type Fetcher<T> = ({ signal }: { signal: AbortSignal }) => Promise<T>;

export const POLLING_INTERVAL = 2000;
export const MAX_ERRORS = 5;

export function createPolling<T>(fetcher: Fetcher<T>, options?: Options<T>) {
  const {
    maxErrors = MAX_ERRORS,
    maxPolls = isTest() ? 5 : Infinity,
    interval = isTest() ? 1 : POLLING_INTERVAL,
    until = () => true,
    breakIf = () => false,
    breakIfError = () => false,

    onStart = () => {},
    onBreak = () => {},
    onComplete = () => {},
    onNext = () => {},
    onError = () => {},
    onErrorBreak = () => {},
    onTooManyAttempts = () => {},
    onTooManyErrors = () => {},
    onIntervalError = () => {},
    onFinish = () => {},
  } = validateOptions(options);

  let abortController = new AbortController();
  let pollPromise: Promise<State<T>> | null = null;

  const promisifiedFetcher = async () => await fetcher({ signal: abortController.signal });
  const abortableFetch = () => abortablePromise(promisifiedFetcher(), abortController.signal);

  const abort = async () => {
    if (pollPromise) {
      abortController.abort();
    }

    return pollPromise;
  };

  const state = createPollState<T>();

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

  const _poll = async () => {
    state.on.start();
    onStart();

    while (true) {
      if (abortController.signal.aborted) {
        return state.get.all();
      }

      try {
        const data = await abortableFetch();

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

        await abortableWait(newInterval, abortController.signal);
      } catch (e) {
        if (e.name === 'AbortError') {
          return state.get.all();
        }

        state.on.newCatch(e);

        onError(state.get.catch());

        if (breakIfError(state.get.catch())) {
          onErrorBreak(state.get.catch());
          break;
        }

        if (getIsTooManyErrors()) {
          onTooManyErrors(state.get.catch());
          break;
        }

        const { isValid, newInterval } = getInterval();
        if (!isValid) {
          onIntervalError(state.get.all());
          break;
        }

        await abortableWait(newInterval, abortController.signal);
      }
    }

    onFinish(state.get.all());

    return state.get.all();
  };

  const poll = async () => {
    if (pollPromise) return pollPromise;

    pollPromise = _poll();
    return pollPromise;
  };

  return { init: poll, abort };
}
