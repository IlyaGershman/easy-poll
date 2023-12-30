import { doPolling } from '../doPolling';

describe('doPolling', () => {
  it('should throw an error when maxErrors is less than 0', async () => {
    const fetcher = jest.fn();

    expect(() => doPolling(fetcher, { maxErrors: -1 })).toThrow('maxErrors must be greater than or equal to 0');
  });

  it('should throw an error when interval is less than 0', async () => {
    const fetcher = jest.fn();

    expect(() => doPolling(fetcher, { interval: -1 })).toThrow('interval must be greater than or equal to 0');
  });

  it('should throw an error when interval not a number or a function', async () => {
    const fetcher = jest.fn();

    // @ts-ignore
    expect(() => doPolling(fetcher, { interval: 'not a number' })).toThrow('interval must be a function or a number');
  });

  it('should call fetcher', async () => {
    const fetcher = jest.fn();

    await doPolling(fetcher);

    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it('should call onStart', async () => {
    const onStart = jest.fn();
    const fetcher = jest.fn();

    await doPolling(fetcher, {
      onStart,
    });

    expect(onStart).toHaveBeenCalledTimes(1);
  });

  it('should call onFinish', async () => {
    const onFinish = jest.fn();
    const fetcher = jest.fn();

    await doPolling(fetcher, {
      onFinish,
    });

    expect(onFinish).toHaveBeenCalledTimes(1);
  });

  it('should call onComplete', async () => {
    const onComplete = jest.fn();
    const fetcher = jest.fn().mockReturnValue('data');

    await doPolling(fetcher, {
      onComplete,
      until: () => true,
    });

    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onComplete).toHaveBeenCalledWith({
      data: 'data',
      attempt: 1,
      attemptsDuration: [expect.any(Number)],
      duration: expect.any(Number),
      errorsCount: 0,
    });
  });

  it('should call onNext', async () => {
    const onNext = jest.fn();
    const fetcher = jest.fn().mockReturnValue('data');

    await doPolling(fetcher, {
      onNext,
      until: () => false,
    });

    expect(onNext).toHaveBeenCalledTimes(4);
    expect(onNext).toHaveBeenLastCalledWith({
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
    });
  });

  it('should call onTooManyAttempts', async () => {
    const onTooManyAttempts = jest.fn();
    const fetcher = jest.fn().mockReturnValue('data');

    await doPolling(fetcher, {
      onTooManyAttempts,
      until: () => false,
    });

    expect(onTooManyAttempts).toHaveBeenCalledTimes(1);
    expect(onTooManyAttempts).toHaveBeenCalledWith({
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
    });
  });

  it('should call onError', async () => {
    const onError = jest.fn();
    const fetcher = jest.fn().mockRejectedValue(new Error('error'));

    await doPolling(fetcher, {
      onError,
    });

    expect(onError).toHaveBeenCalledTimes(5);
    expect(onError).toHaveBeenLastCalledWith({
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
    });
  });

  it('should call onTooManyErrors', async () => {
    const onTooManyErrors = jest.fn();
    const fetcher = jest.fn().mockRejectedValue(new Error('error'));

    await doPolling(fetcher, {
      onTooManyErrors,
    });

    expect(onTooManyErrors).toHaveBeenCalledTimes(1);
    expect(onTooManyErrors).toHaveBeenCalledWith({
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
    });
  });

  it('should call onBreak and stop the polling', async () => {
    const onBreak = jest.fn();
    const fetcher = jest.fn().mockReturnValue('data');

    await doPolling(fetcher, {
      onBreak,
      breakIf: () => true,
    });

    expect(onBreak).toHaveBeenCalledTimes(1);
    expect(onBreak).toHaveBeenCalledWith({
      data: 'data',
      attempt: 1,
      errorsCount: 0,
      attemptsDuration: [expect.any(Number)],
      duration: expect.any(Number),
    });
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it('should call fetcher 5 times when it throws', async () => {
    const fetcher = jest.fn().mockRejectedValue(new Error('error'));

    await doPolling(fetcher);

    expect(fetcher).toHaveBeenCalledTimes(5);
  });

  it('should call fetcher 2 times when it throws and when maxErrors is specified', async () => {
    const fetcher = jest.fn().mockRejectedValue(new Error('error'));

    await doPolling(fetcher, {
      maxErrors: 2,
    });

    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it('should call fetcher 2 times when maxPolls is specified and condition is not met', async () => {
    const fetcher = jest.fn();

    await doPolling(fetcher, {
      until: () => false,
      maxPolls: 2,
    });

    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it('should return data from the latest polling result when the condition is met, the error should be null', async () => {
    const fetcher = jest.fn().mockReturnValue(5);
    let counter = 1;

    const { data, error, attempt, attemptsDuration, duration, errorsCount } = await doPolling(fetcher, {
      until: ({ data }) => counter++ === data,
    });

    expect(data).toBe(5);
    expect(error).toBeNull();
    expect(attempt).toBe(5);
    expect(attemptsDuration).toHaveLength(5);
    expect(duration).toBeGreaterThanOrEqual(0);
    expect(errorsCount).toBe(0);
  });

  it('should return data from the latest polling result when max polling was triggered, the error should be null', async () => {
    const fetcher = jest.fn().mockReturnValue('data');

    const { data, error, attempt, attemptsDuration, duration, errorsCount } = await doPolling(fetcher, {
      until: () => false,
    });

    expect(data).toBe('data');
    expect(error).toBeNull();
    expect(attempt).toBe(5);
    expect(attemptsDuration).toHaveLength(5);
    expect(duration).toBeGreaterThanOrEqual(0);
    expect(errorsCount).toBe(0);
  });

  it('should return data from the latest polling result when breakIf was triggered, the error should be null', async () => {
    const fetcher = jest.fn().mockReturnValue('data');

    const { data, error, attempt, attemptsDuration, duration, errorsCount } = await doPolling(fetcher, {
      breakIf: () => true,
    });

    expect(data).toBe('data');
    expect(error).toBeNull();
    expect(attempt).toBe(1);
    expect(attemptsDuration).toHaveLength(1);
    expect(duration).toBeGreaterThanOrEqual(0);
    expect(errorsCount).toBe(0);
  });

  it('should return error when polling has failed the data should be null', async () => {
    const fetcher = jest.fn().mockRejectedValue(new Error('error'));

    const { error, data, attempt, attemptsDuration, duration, errorsCount } = await doPolling(fetcher);

    expect(error).toEqual(new Error('error'));
    expect(data).toBeNull();
    expect(attempt).toBe(5);
    expect(attemptsDuration).toHaveLength(5);
    expect(duration).toBeGreaterThanOrEqual(0);
    expect(errorsCount).toBe(5);
  });

  it('interval can be a function', async () => {
    const fetcher = jest.fn().mockReturnValue('data');
    const interval = jest.fn().mockReturnValue(1);

    await doPolling(fetcher, {
      until: () => false,
      interval,
    });

    expect(interval).toHaveBeenCalledTimes(4);
  });

  it('onIntervalError should be called when interval function returns bad interval', async () => {
    const fetcher = jest.fn().mockReturnValue('data');
    const onIntervalError = jest.fn();

    await doPolling(fetcher, {
      until: () => false,
      interval: () => -1,
      onIntervalError,
    });

    expect(onIntervalError).toHaveBeenCalledTimes(1);
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

    const { attempt, error, data } = await doPolling(fetcher, {
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
});
