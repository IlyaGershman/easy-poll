import { createPollState, State, StateCatch, StateSuccess } from './state';
import { AbortablesAbort, createAbortabes } from './abortables';
import { createIntervalHandler } from './interval';
import { validateOptions } from './validateOptions';

import { isTest } from '../../utils/envs';

export type PollingSuccessContext<T> = StateSuccess<T>;
export type PollingErrorContext<T> = StateCatch<T>;
export type PollingContext<T> = State<T>;

export type ReactionsProps<T> = PollingSuccessContext<T> | PollingErrorContext<T> | PollingContext<T>;

export type Reactions<T> = {
  onStart?: () => void;
  onFinish?: (props: PollingContext<T>) => void;
  onComplete?: (props: PollingSuccessContext<T>) => void;
  onBreak?: (props: PollingSuccessContext<T>) => void;
  onNext?: (props: PollingSuccessContext<T>) => void;
  onTooManyAttempts?: (props: PollingSuccessContext<T>) => void;
  onError?: (props: PollingErrorContext<T>) => void;
  onErrorBreak?: (props: PollingErrorContext<T>) => void;
  onTooManyErrors?: (props: PollingErrorContext<T>) => void;
  onIntervalError?: (props: PollingContext<T>) => void;
};

export type PureOptions<T> = {
  maxErrors?: number;
  maxPolls?: number;
  interval?: ((props: PollingContext<T>) => number) | number;
  until?: (props: PollingSuccessContext<T>) => boolean;
  breakIf?: (props: PollingSuccessContext<T>) => boolean;
  breakIfError?: (props: PollingErrorContext<T>) => boolean;
};

export type Options<T> = PureOptions<T> & Reactions<T>;
export type Fetcher<T> = ({ signal }: { signal: AbortSignal }) => Promise<T>;

export const POLLING_INTERVAL = 2000;
export const MAX_ERRORS = 5;
export const MAX_POLLS = Infinity;

export function createPolling<T>(fetcher: Fetcher<T>, options?: Options<T>) {
  const {
    maxErrors = MAX_ERRORS,
    maxPolls = isTest() ? 5 : MAX_POLLS,
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

  const state = createPollState<T>();
  const abortables = createAbortabes(fetcher);

  const intervalHandler = createIntervalHandler(interval);

  const isTooMany = {
    attempts: () => state.get.attempt() >= maxPolls,
    errors: () => state.get.errorsCount() >= maxErrors,
  };

  const poll = async () => {
    state.on.start();
    onStart();

    while (true) {
      if (abortables.isAborted()) {
        return state.get.all();
      }

      try {
        const data = await abortables.fetcher();

        state.on.newData(data);

        if (breakIf(state.get.success())) {
          onBreak(state.get.success());
          break;
        }

        if (until(state.get.success())) {
          onComplete(state.get.success());
          break;
        }

        if (isTooMany.attempts()) {
          onTooManyAttempts(state.get.success());
          break;
        }

        const { error: intervalError, newInterval } = intervalHandler.get(state.get.all());
        if (intervalError) {
          state.on.intervalCatch(intervalError);
          onIntervalError(state.get.all());
          break;
        }

        onNext(state.get.success());

        await abortables.wait(newInterval);
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

        if (isTooMany.errors()) {
          onTooManyErrors(state.get.catch());
          break;
        }

        const { error: intervalError, newInterval } = intervalHandler.get(state.get.all());
        if (intervalError) {
          state.on.intervalCatch(intervalError);
          onIntervalError(state.get.all());
          break;
        }

        await abortables.wait(newInterval);
      }
    }

    onFinish(state.get.all());

    return state.get.all();
  };

  const { init, abort } = createPollingHandlers<T>(poll, abortables.abort);

  return { init, abort };
}

function createPollingHandlers<T>(poll: () => Promise<PollingContext<T>>, abort: AbortablesAbort) {
  // this promise is going to be resolved only once and reused when handlers are called multiple times
  let pollPromise: Promise<PollingContext<T>> | null = null;

  const initPolling = async () => {
    if (pollPromise) return pollPromise;

    pollPromise = poll();
    return pollPromise;
  };

  const abortPolling = async () => {
    if (pollPromise) {
      abort();
    }

    return pollPromise;
  };

  return { init: initPolling, abort: abortPolling };
}
