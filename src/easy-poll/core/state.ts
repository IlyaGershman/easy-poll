import { createTimer } from '../../utils/timers';

export function createState<T>() {
  const timer = createTimer();

  let data: T | null = null;
  let attempt = 0;
  let attemptsDuration: number[] = [];
  let error = null;
  let errorsCount = 0;

  const get = {
    attempt: () => attempt,
    errorsCount: () => errorsCount,

    common: () => ({ attempt, attemptsDuration, errorsCount, duration: timer.duration() }),
    success: () => ({ ...get.common(), data }),
    catch: () => ({ ...get.common(), error }),
    all: () => ({ ...get.common(), data, error }),
  };

  const on = {
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
