import { EVENTS } from '../consts/events';
import { subscribePolling } from '../subscribePolling';

describe('subscribePolling', () => {
  it('should throw an error when maxErrors is less than 0', async () => {
    const fetcher = jest.fn();

    expect(() => subscribePolling(fetcher, { maxErrors: -1 })).toThrow('maxErrors must be greater than or equal to 0');
  });

  it('should throw an error when interval is less than 0', async () => {
    const fetcher = jest.fn();

    expect(() => subscribePolling(fetcher, { interval: -1 })).toThrow('interval must be greater than or equal to 0');
  });

  it('should call fetcher', async () => {
    const fetcher = jest.fn();

    const { poll } = subscribePolling(fetcher);
    await poll;

    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it('should subscribe and call onStart', async () => {
    const onStart = jest.fn();
    const fetcher = jest.fn();

    const { subscribe, poll } = subscribePolling(fetcher);
    subscribe(props => {
      if (props.event === EVENTS.ON_START) onStart(props);
    });
    await poll;

    expect(onStart).toHaveBeenCalledTimes(1);
  });

  it('should unsubscribe and NOT call onStart', async () => {
    const onStart = jest.fn();
    const fetcher = jest.fn();

    const { subscribe, poll } = subscribePolling(fetcher);
    const { unsubscribe } = subscribe(props => {
      if (props.event === EVENTS.ON_START) onStart(props);
    });
    unsubscribe();
    await poll;

    expect(onStart).toHaveBeenCalledTimes(0);
  });

  it('should call onFinish', async () => {
    const onFinish = jest.fn();
    const fetcher = jest.fn();

    const { subscribe, poll } = subscribePolling(fetcher);
    subscribe(props => {
      if (props.event === EVENTS.ON_FINISH) onFinish(props);
    });
    await poll;

    expect(onFinish).toHaveBeenCalledTimes(1);
  });

  it('should call onComplete', async () => {
    const onComplete = jest.fn();
    const fetcher = jest.fn().mockReturnValue('data');

    const { subscribe, poll } = subscribePolling(fetcher);
    subscribe(props => {
      if (props.event === EVENTS.ON_COMPLETE) onComplete(props);
    });
    await poll;

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

    const { subscribe, poll } = subscribePolling(fetcher, {
      until: () => false,
    });

    subscribe(props => {
      if (props.event === EVENTS.ON_NEXT) onNext(props);
    });
    await poll;

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

    const { subscribe, poll } = subscribePolling(fetcher, {
      until: () => false,
    });

    subscribe(props => {
      if (props.event === EVENTS.ON_TOOMANYATTEMPTS) onTooManyAttempts(props);
    });
    await poll;

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

    const { subscribe, poll } = subscribePolling(fetcher, {
      until: () => false,
    });

    subscribe(props => {
      if (props.event === EVENTS.ON_ERROR) onError(props);
    });
    await poll;

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

  it('should call onTooManyErrors', async () => {
    const onTooManyErrors = jest.fn();
    const fetcher = jest.fn().mockRejectedValue(new Error('error'));

    const { subscribe, poll } = subscribePolling(fetcher, {
      until: () => false,
    });

    subscribe(props => {
      if (props.event === EVENTS.ON_TOOMANYERRORS) onTooManyErrors(props);
    });
    await poll;

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

    const { subscribe, poll } = subscribePolling(fetcher, {
      breakIf: () => true,
    });

    subscribe(props => {
      if (props.event === EVENTS.ON_BREAK) onBreak(props);
    });
    await poll;

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

    const { poll } = subscribePolling(fetcher, {
      until: ({ data }) => counter++ === data,
    });

    const { data, error, attempt, attemptsDuration, duration, errorsCount } = await poll;

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

    const { subscribe, poll } = subscribePolling(fetcher, {
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

    const { attempt, error, data } = await poll;

    expect(attempt).toBe(1);
    expect(error).toBeNull();
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
});
