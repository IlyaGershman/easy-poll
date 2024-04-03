import { createTimer } from '../../utils/timers';

export function createPollState<T>() {
  const timer = createTimer();

  let data: T | null = null;
  let attempt = 0;
  let attemptsDuration: number[] = [];
  let error = null;
  let errorsCount = 0;
  let initiatedAfter = 0;

  const get = {
    attempt: () => attempt,
    errorsCount: () => errorsCount,

    common: () => ({ attempt, attemptsDuration, errorsCount, duration: timer.duration() }),
    success: () => ({ ...get.common(), data }),
    catch: () => ({ ...get.common(), error }),
    all: () => ({ ...get.common(), data, error }),
  };

  const on = {
    start: () => {
      initiatedAfter = timer.duration();
      timer.reset();
    },
    newAttempt: () => {
      attempt += 1;
      attemptsDuration.push(timer.duration());
    },
    newData: (d: T) => {
      on.newAttempt();
      data = d;
      error = null;
    },
    newCatch: (e: any) => {
      on.newAttempt();
      error = e;
      data = null;
      errorsCount += 1;
    },
    intervalCatch: (e: any) => {
      error = e;
    },
  };

  return { get, on };
}
export type State<T> = ReturnType<ReturnType<typeof createPollState<T>>['get']['all']>;
export type StateSuccess<T> = ReturnType<ReturnType<typeof createPollState<T>>['get']['success']>;
export type StateCatch<T> = ReturnType<ReturnType<typeof createPollState<T>>['get']['catch']>;
