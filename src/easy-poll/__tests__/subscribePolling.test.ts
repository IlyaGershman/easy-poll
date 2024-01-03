import { EVENTS } from '../consts/events';
import { subscribePolling } from '../subscribePolling';

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
    expect(error).not.toBeNull();
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

  it('should emergency break', async () => {
    const abort = jest.fn().mockReturnValue(true);
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
      abort,
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
    expect(error).toBeNull();
    expect(data).toBe('data');
    expect(abort).toHaveBeenCalledTimes(1);
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(onFinish).toHaveBeenCalledTimes(0);
    expect(onComplete).toHaveBeenCalledTimes(0);
    expect(onBreak).toHaveBeenCalledTimes(0);
    expect(onNext).toHaveBeenCalledTimes(0);
    expect(onError).toHaveBeenCalledTimes(0);
    expect(onTooManyErrors).toHaveBeenCalledTimes(0);
    expect(onTooManyAttempts).toHaveBeenCalledTimes(0);
  });

  it('should be able to emergency break with error', async () => {
    const abort = jest.fn().mockReturnValue(true);
    const fetcher = jest.fn().mockRejectedValue(new Error('error'));
    const onComplete = jest.fn();
    const onFinish = jest.fn();

    const { subscribe, init } = subscribePolling(fetcher, {
      until: () => false,
      abort,
    });

    subscribe(props => {
      if (props.event === EVENTS.ON_COMPLETE) onComplete(props);
      if (props.event === EVENTS.ON_FINISH) onFinish(props);
    });

    const { attempt, error, data } = await init();

    expect(attempt).toBe(1);
    expect(error).toEqual(new Error('error'));
    expect(data).toBeNull();
    expect(abort).toHaveBeenCalledTimes(1);
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(onFinish).toHaveBeenCalledTimes(0);
    expect(onComplete).toHaveBeenCalledTimes(0);
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

    it('should throw an error when abort is not a function', async () => {
      const fetcher = jest.fn();
      const abort = 'not a function';

      // @ts-ignore
      expect(() => subscribePolling(fetcher, { abort })).toThrow('abort must be a function');
    });
  });
});
