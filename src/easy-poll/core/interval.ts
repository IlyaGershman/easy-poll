import { assertIsPositiveNumber, assertNumber } from '../../utils/asserts';
import { State } from './state';

type IntervalWithError = { error: any; newInterval: null };
type IntervalWithSuccess = { error: null; newInterval: number };
type IntervalFunction<T> = (props: State<T>) => unknown;

export const createIntervalHandler = <T>(
  interval: IntervalFunction<T> | number
): {
  get: (state: State<T>) => IntervalWithSuccess | IntervalWithError;
} => {
  if (typeof interval === 'function') {
    return createFunctionIntervalHandler(interval);
  }

  if (typeof interval === 'number') {
    return createNumberIntervalHandler(interval);
  }
};

const createNumberIntervalHandler = (interval: number) => {
  const get = () => ({
    error: null,
    newInterval: interval,
  });

  return { get };
};

const createFunctionIntervalHandler = <T>(interval: IntervalFunction<T>) => {
  const get = (state: State<T>) => {
    try {
      const newInterval = interval(state);
      assertIsPositiveNumber(newInterval);

      return { error: null, newInterval };
    } catch (error) {
      return { error, newInterval: null };
    }
  };

  return { get };
};
