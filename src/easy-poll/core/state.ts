import { createTimer } from '../../utils/timers';

export function createState<T>() {
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

  const onIntervalCatch = (e: any) => {
    error = e;
  };

  return { errorsCount, attempt, getSuccessState, getErrorState, getState, onNewData, onNewCatch, onIntervalCatch };
}
