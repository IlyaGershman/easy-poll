import { EVENTS } from '../subscribePolling';
import { subscribePolling } from '../subscribePolling';

jest.mock('../core/consts', () => ({
  ...jest.requireActual('../core/consts'),
  POLLING_INTERVAL: 1,
  MAX_POLLS: 5,
}));

describe('subscribePolling', () => {
  it('should call fetcher', async () => {
    const fetcher = jest.fn();

    const { init } = subscribePolling(fetcher);
    await init();

    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it('should subscribe and call onStart', async () => {
    const onStart = jest.fn();
    const fetcher = jest.fn();

    const { subscribe, init } = subscribePolling(fetcher);
    subscribe(props => {
      if (props.event === EVENTS.ON_START) onStart(props);
    });
    await init();

    expect(onStart).toHaveBeenCalledTimes(1);
  });

  it('should unsubscribe and NOT call onStart', async () => {
    const onStart = jest.fn();
    const fetcher = jest.fn();

    const { subscribe, init } = subscribePolling(fetcher);
    const { unsubscribe } = subscribe(props => {
      if (props.event === EVENTS.ON_START) onStart(props);
    });
    unsubscribe();
    await init();

    expect(onStart).toHaveBeenCalledTimes(0);
  });

  it('should call onFinish', async () => {
    const onFinish = jest.fn();
    const fetcher = jest.fn();

    const { subscribe, init } = subscribePolling(fetcher);
    subscribe(props => {
      if (props.event === EVENTS.ON_FINISH) onFinish(props);
    });
    await init();

    expect(onFinish).toHaveBeenCalledTimes(1);
  });

  it('can support many subscribers', async () => {
    const onFinish1 = jest.fn();
    const onFinish2 = jest.fn();
    const onFinish3 = jest.fn();
    const onFinish4 = jest.fn();
    const fetcher = jest.fn();

    const { subscribe, init } = subscribePolling(fetcher);
    subscribe(props => {
      if (props.event === EVENTS.ON_FINISH) onFinish1(props);
    });
    subscribe(props => {
      if (props.event === EVENTS.ON_FINISH) onFinish2(props);
    });
    subscribe(props => {
      if (props.event === EVENTS.ON_FINISH) onFinish3(props);
    });
    subscribe(props => {
      if (props.event === EVENTS.ON_FINISH) onFinish4(props);
    });
    await init();

    expect(onFinish1).toHaveBeenCalledTimes(1);
    expect(onFinish2).toHaveBeenCalledTimes(1);
    expect(onFinish3).toHaveBeenCalledTimes(1);
    expect(onFinish4).toHaveBeenCalledTimes(1);
  });

  it('should call onComplete', async () => {
    const onComplete = jest.fn();
    const fetcher = jest.fn().mockReturnValue('data');

    const { subscribe, init } = subscribePolling(fetcher);
    subscribe(props => {
      if (props.event === EVENTS.ON_COMPLETE) onComplete(props);
    });
    await init();

    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onComplete).toHaveBeenCalledWith({
      event: EVENTS.ON_COMPLETE,
      props: {
        data: 'data',
        attempt: 1,
        attemptsDuration: [expect.any(Number)],
        duration: expect.any(Number),
        errorsCount: 0,
      },
    });
  });

  it('should call onNext', async () => {
    const onNext = jest.fn();
    const fetcher = jest.fn().mockReturnValue('data');

    const { subscribe, init } = subscribePolling(fetcher, {
      until: () => false,
    });

    subscribe(props => {
      if (props.event === EVENTS.ON_NEXT) onNext(props);
    });
    await init();

    expect(onNext).toHaveBeenCalledTimes(4);
    expect(onNext).toHaveBeenLastCalledWith({
      event: EVENTS.ON_NEXT,
      props: {
        data: 'data',
        attempt: 4,
        attemptsDuration: [
          expect.any(Number),
          expect.any(Number),
          expect.any(Number),
          expect.any(Number),
          expect.any(Number),
        ],
        duration: expect.any(Number),
        errorsCount: 0,
      },
    });
  });

  it('should call onTooManyAttempts', async () => {
    const onTooManyAttempts = jest.fn();
    const fetcher = jest.fn().mockReturnValue('data');

    const { subscribe, init } = subscribePolling(fetcher, {
      until: () => false,
    });

    subscribe(props => {
      if (props.event === EVENTS.ON_TOOMANYATTEMPTS) onTooManyAttempts(props);
    });
    await init();

    expect(onTooManyAttempts).toHaveBeenCalledTimes(1);
    expect(onTooManyAttempts).toHaveBeenCalledWith({
      event: EVENTS.ON_TOOMANYATTEMPTS,
      props: {
        attempt: 5,
        errorsCount: 0,
        data: 'data',
        attemptsDuration: [
          expect.any(Number),
          expect.any(Number),
          expect.any(Number),
          expect.any(Number),
          expect.any(Number),
        ],
        duration: expect.any(Number),
      },
    });
  });

  it('should call onError', async () => {
    const onError = jest.fn();
    const fetcher = jest.fn().mockRejectedValue(new Error('error'));

    const { subscribe, init } = subscribePolling(fetcher, {
      until: () => false,
    });

    subscribe(props => {
      if (props.event === EVENTS.ON_ERROR) onError(props);
    });
    await init();

    expect(onError).toHaveBeenCalledTimes(5);
    expect(onError).toHaveBeenLastCalledWith({
      event: EVENTS.ON_ERROR,
      props: {
        attempt: 5,
        errorsCount: 5,
        error: new Error('error'),
        attemptsDuration: [
          expect.any(Number),
          expect.any(Number),
          expect.any(Number),
          expect.any(Number),
          expect.any(Number),
        ],
        duration: expect.any(Number),
      },
    });
  });

  it('should call onErrorBreak', async () => {
    const onErrorBreak = jest.fn();
    const fetcher = jest.fn().mockRejectedValue(new Error('error'));

    const { subscribe, init } = subscribePolling(fetcher, { breakIfError: () => true });

    subscribe(props => {
      if (props.event === EVENTS.ON_ERRORBREAK) onErrorBreak(props);
    });
    await init();

    expect(onErrorBreak).toHaveBeenCalledTimes(1);
    expect(onErrorBreak).toHaveBeenCalledWith({
      event: EVENTS.ON_ERRORBREAK,
      props: {
        attempt: 1,
        errorsCount: 1,
        error: new Error('error'),
        attemptsDuration: [expect.any(Number)],
        duration: expect.any(Number),
      },
    });
  });

  it('should call onTooManyErrors', async () => {
    const onTooManyErrors = jest.fn();
    const fetcher = jest.fn().mockRejectedValue(new Error('error'));

    const { subscribe, init } = subscribePolling(fetcher, {
      until: () => false,
    });

    subscribe(props => {
      if (props.event === EVENTS.ON_TOOMANYERRORS) onTooManyErrors(props);
    });
    await init();

    expect(onTooManyErrors).toHaveBeenCalledTimes(1);
    expect(onTooManyErrors).toHaveBeenCalledWith({
      event: EVENTS.ON_TOOMANYERRORS,
      props: {
        attempt: 5,
        errorsCount: 5,
        error: new Error('error'),
        attemptsDuration: [
          expect.any(Number),
          expect.any(Number),
          expect.any(Number),
          expect.any(Number),
          expect.any(Number),
        ],
        duration: expect.any(Number),
      },
    });
  });

  it('should call onBreak and stop the polling', async () => {
    const onBreak = jest.fn();
    const fetcher = jest.fn().mockReturnValue('data');

    const { subscribe, init } = subscribePolling(fetcher, {
      breakIf: () => true,
    });

    subscribe(props => {
      if (props.event === EVENTS.ON_BREAK) onBreak(props);
    });
    await init();

    expect(onBreak).toHaveBeenCalledTimes(1);
    expect(onBreak).toHaveBeenCalledWith({
      event: EVENTS.ON_BREAK,
      props: {
        data: 'data',
        attempt: 1,
        errorsCount: 0,
        attemptsDuration: [expect.any(Number)],
        duration: expect.any(Number),
      },
    });
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it('should return data from the latest polling result when the condition is met, the error should be null', async () => {
    const fetcher = jest.fn().mockReturnValue(5);
    let counter = 1;

    const { init } = subscribePolling(fetcher, {
      until: ({ data }) => counter++ === data,
    });

    const { data, error, attempt, attemptsDuration, duration, errorsCount } = await init();

    expect(data).toBe(5);
    expect(error).toBeNull();
    expect(attempt).toBe(5);
    expect(attemptsDuration).toHaveLength(5);
    expect(duration).toBeGreaterThanOrEqual(0);
    expect(errorsCount).toBe(0);
  });

  it('onIntervalError should be called when interval function returns bad interval', async () => {
    const fetcher = jest.fn().mockReturnValue('data');
    const onIntervalError = jest.fn();

    const { subscribe, init } = await subscribePolling(fetcher, {
      until: () => false,
      interval: () => -1,
    });

    subscribe(props => {
      if (props.event === EVENTS.ON_INTERVALERROR) onIntervalError(props);
    });

    const { error } = await init();

    expect(onIntervalError).toHaveBeenCalledTimes(1);
    expect(onIntervalError).toHaveBeenCalledWith({
      event: EVENTS.ON_INTERVALERROR,
      props: {
        attempt: 1,
        errorsCount: 0,
        data: 'data',
        attemptsDuration: [expect.any(Number)],
        duration: expect.any(Number),
        error: new Error('value must be greater than or equal to 0'),
      },
    });
    expect(error.message).toBe('value must be greater than or equal to 0');
  });

  it('should stop polling when interval function returns bad interval', async () => {
    const fetcher = jest.fn().mockReturnValue('data');
    const onComplete = jest.fn();
    const onBreak = jest.fn();
    const onNext = jest.fn();
    const onError = jest.fn();
    const onTooManyErrors = jest.fn();
    const onTooManyAttempts = jest.fn();
    const onFinish = jest.fn();

    const { subscribe, init } = subscribePolling(fetcher, {
      until: () => false,
      onComplete,
      onBreak,
      onNext,
      onError,
      onFinish,
      onTooManyErrors,
      onTooManyAttempts,
      // @ts-ignore
      interval: () => 'bad interval',
    });

    subscribe(props => {
      if (props.event === EVENTS.ON_COMPLETE) onComplete(props);
      if (props.event === EVENTS.ON_BREAK) onBreak(props);
      if (props.event === EVENTS.ON_NEXT) onNext(props);
      if (props.event === EVENTS.ON_ERROR) onError(props);
      if (props.event === EVENTS.ON_FINISH) onFinish(props);
      if (props.event === EVENTS.ON_TOOMANYERRORS) onTooManyErrors(props);
      if (props.event === EVENTS.ON_TOOMANYATTEMPTS) onTooManyAttempts(props);
    });

    const { attempt, error, data } = await init();

    expect(attempt).toBe(1);
    expect(error.message).toBe('value must be a number');
    expect(data).toBe('data');
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(onFinish).toHaveBeenCalledTimes(1);
    expect(onComplete).toHaveBeenCalledTimes(0);
    expect(onBreak).toHaveBeenCalledTimes(0);
    expect(onNext).toHaveBeenCalledTimes(0);
    expect(onError).toHaveBeenCalledTimes(0);
    expect(onTooManyErrors).toHaveBeenCalledTimes(0);
    expect(onTooManyAttempts).toHaveBeenCalledTimes(0);
  });

  it('should abort', async () => {
    const fetcher = jest.fn().mockReturnValue('data');
    const onComplete = jest.fn();
    const onBreak = jest.fn();
    const onNext = jest.fn();
    const onError = jest.fn();
    const onTooManyErrors = jest.fn();
    const onTooManyAttempts = jest.fn();
    const onFinish = jest.fn();

    const { subscribe, init, abort } = subscribePolling(fetcher, {
      until: () => false,
      interval: 200,
    });

    subscribe(props => {
      if (props.event === EVENTS.ON_COMPLETE) onComplete(props);
      if (props.event === EVENTS.ON_BREAK) onBreak(props);
      if (props.event === EVENTS.ON_NEXT) onNext(props);
      if (props.event === EVENTS.ON_ERROR) onError(props);
      if (props.event === EVENTS.ON_FINISH) onFinish(props);
      if (props.event === EVENTS.ON_TOOMANYERRORS) onTooManyErrors(props);
      if (props.event === EVENTS.ON_TOOMANYATTEMPTS) onTooManyAttempts(props);
    });

    let attempt, error, data;
    const promise = init().then(props => {
      attempt = props.attempt;
      error = props.error;
      data = props.data;
    });

    abort();

    await promise;

    expect(attempt).toBe(0);
    expect(error).toBeNull();
    expect(data).toBeNull();
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(onNext).toHaveBeenCalledTimes(0);
    expect(onFinish).toHaveBeenCalledTimes(0);
    expect(onComplete).toHaveBeenCalledTimes(0);
    expect(onBreak).toHaveBeenCalledTimes(0);
    expect(onError).toHaveBeenCalledTimes(0);
    expect(onTooManyErrors).toHaveBeenCalledTimes(0);
    expect(onTooManyAttempts).toHaveBeenCalledTimes(0);
  });

  it('should abort when fetcher returns error', async () => {
    const fetcher = jest.fn().mockRejectedValue(new Error('error'));
    const onComplete = jest.fn();
    const onFinish = jest.fn();

    const { subscribe, init, abort } = subscribePolling(fetcher, {
      until: () => false,
      interval: 200,
    });

    subscribe(props => {
      if (props.event === EVENTS.ON_COMPLETE) onComplete(props);
      if (props.event === EVENTS.ON_FINISH) onFinish(props);
    });

    let attempt, error, data;
    const promise = init().then(props => {
      attempt = props.attempt;
      error = props.error;
      data = props.data;
    });

    abort();

    await promise;

    expect(attempt).toBe(0);
    expect(error).toBeNull();
    expect(data).toBeNull();
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(onFinish).toHaveBeenCalledTimes(0);
    expect(onComplete).toHaveBeenCalledTimes(0);
  });

  it('should support multiple aborts', async () => {
    const fetcher1 = jest.fn().mockReturnValue('data');
    const fetcher2 = jest.fn().mockReturnValue(5);
    const fetcher3 = jest.fn().mockReturnValue(5);
    const onComplete1 = jest.fn();
    const onComplete2 = jest.fn();
    const onComplete3 = jest.fn();

    const {
      init: init1,
      subscribe: subscribe1,
      abort: abort1,
    } = subscribePolling(fetcher1, {
      until: () => false,
      interval: 50,
    });

    let c2 = 1;
    const { init: init2, subscribe: subscribe2 } = subscribePolling(fetcher2, {
      until: ({ data }) => data === c2++,
      interval: 50,
    });

    let c3 = 1;
    const {
      init: init3,
      subscribe: subscribe3,
      abort: abort3,
    } = subscribePolling(fetcher3, {
      until: ({ data }) => data === c3++,
      interval: 50,
    });

    subscribe1(props => {
      if (props.event === EVENTS.ON_COMPLETE) onComplete1(props);
    });

    subscribe2(props => {
      if (props.event === EVENTS.ON_COMPLETE) onComplete2(props);
    });

    subscribe3(props => {
      if (props.event === EVENTS.ON_COMPLETE) onComplete3(props);
    });

    init1();
    const p2 = init2();
    const p3 = init3();

    abort1();
    const res = await abort3();

    await Promise.all([p3, p2]);

    expect(res).toStrictEqual({
      attempt: 0,
      attemptsDuration: [],
      data: null,
      duration: expect.any(Number),
      error: null,
      errorsCount: 0,
    });
    expect(fetcher1).toHaveBeenCalledTimes(1);
    expect(fetcher2).toHaveBeenCalledTimes(5);
    expect(fetcher3).toHaveBeenCalledTimes(1);
    expect(onComplete1).toHaveBeenCalledTimes(0);
    expect(onComplete2).toHaveBeenCalledTimes(1);
    expect(onComplete3).toHaveBeenCalledTimes(0);
  });

  it('calling init multiple times should return the same promise', async () => {
    const fetcher = jest.fn().mockReturnValue('data');
    const { init } = subscribePolling(fetcher);

    const p1 = init();
    const p2 = init();

    await p1;

    expect(p1).toStrictEqual(p2);
  });

  it('calling abort multiple times should return the same promise', async () => {
    const fetcher = jest.fn().mockReturnValue('data');
    const { init, abort } = subscribePolling(fetcher);

    init();
    const p1 = abort();
    const p2 = abort();

    await p1;

    expect(p1).toStrictEqual(p2);
  });

  describe('options validation', () => {
    it('should throw an error when maxErrors is less than 0', async () => {
      const fetcher = jest.fn();

      expect(() => subscribePolling(fetcher, { maxErrors: -1 })).toThrow(
        'maxErrors must be greater than or equal to 0'
      );
    });

    it('should throw an error when interval is less than 0', async () => {
      const fetcher = jest.fn();

      expect(() => subscribePolling(fetcher, { interval: -1 })).toThrow('interval must be greater than or equal to 0');
    });

    it('should throw an error when interval not a number or a function', async () => {
      const fetcher = jest.fn();

      // @ts-ignore
      expect(() => subscribePolling(fetcher, { interval: 'not a number' })).toThrow(
        'interval must be a function or a number'
      );
    });

    it('should throw an error when maxPolls is less than 0', async () => {
      const fetcher = jest.fn();

      expect(() => subscribePolling(fetcher, { maxPolls: -1 })).toThrow('maxPolls must be greater than or equal to 0');
    });

    it('should throw an error when until is not a function', async () => {
      const fetcher = jest.fn();
      const until = 'not a function';

      // @ts-ignore
      expect(() => subscribePolling(fetcher, { until })).toThrow('until must be a function');
    });

    it('should throw an error when breakIf is not a function', async () => {
      const fetcher = jest.fn();
      const breakIf = 'not a function';

      // @ts-ignore
      expect(() => subscribePolling(fetcher, { breakIf })).toThrow('breakIf must be a function');
    });

    it('should throw an error when breakIfError is not a function', async () => {
      const fetcher = jest.fn();
      const breakIfError = 'not a function';

      // @ts-ignore
      expect(() => subscribePolling(fetcher, { breakIfError })).toThrow('breakIfError must be a function');
    });
  });
});
