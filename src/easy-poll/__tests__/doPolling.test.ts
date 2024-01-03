import { doPolling } from '../doPolling';

describe('doPolling', () => {
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

  it('should call onErrorBreak', async () => {
    const onErrorBreak = jest.fn();
    const onError = jest.fn().mockReturnValue({ shouldBreak: true });
    const onFinish = jest.fn();
    const fetcher = jest.fn().mockRejectedValue(new Error('error'));

    await doPolling(fetcher, {
      breakIfError: () => true,
      onErrorBreak,
      onError,
      onFinish,
    });

    expect(onFinish).toHaveBeenCalledTimes(1);
    expect(onError).toHaveBeenCalledTimes(1);
    expect(onErrorBreak).toHaveBeenCalledTimes(1);
    expect(onErrorBreak).toHaveBeenCalledWith({
      attempt: 1,
      errorsCount: 1,
      error: new Error('error'),
      attemptsDuration: [expect.any(Number)],
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

  it('should emergency break when abort returns true', async () => {
    const fetcher = jest.fn().mockReturnValue('data');
    const abort = jest.fn().mockReturnValue(true);
    const onComplete = jest.fn();
    const onBreak = jest.fn();
    const onNext = jest.fn();
    const onError = jest.fn();
    const onTooManyErrors = jest.fn();
    const onTooManyAttempts = jest.fn();
    const onFinish = jest.fn();

    const { attempt, error, data } = await doPolling(fetcher, {
      until: () => false,
      abort,
      onComplete,
      onBreak,
      onNext,
      onError,
      onFinish,
      onTooManyErrors,
      onTooManyAttempts,
    });

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

    const { attempt, error, data } = await doPolling(fetcher, {
      until: () => false,
      abort,
      onComplete,
      onFinish,
    });

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

    it('should throw an error when maxPolls is less than 0', async () => {
      const fetcher = jest.fn();

      expect(() => doPolling(fetcher, { maxPolls: -1 })).toThrow('maxPolls must be greater than or equal to 0');
    });

    it('should throw an error when until is not a function', async () => {
      const fetcher = jest.fn();
      const until = 'not a function';

      // @ts-ignore
      expect(() => doPolling(fetcher, { until })).toThrow('until must be a function');
    });

    it('should throw an error when breakIf is not a function', async () => {
      const fetcher = jest.fn();
      const breakIf = 'not a function';

      // @ts-ignore
      expect(() => doPolling(fetcher, { breakIf })).toThrow('breakIf must be a function');
    });

    it('should throw an error when onStart is not a function', async () => {
      const fetcher = jest.fn();
      const onStart = 'not a function';

      // @ts-ignore
      expect(() => doPolling(fetcher, { onStart })).toThrow('onStart must be a function');
    });

    it('should throw an error when onFinish is not a function', async () => {
      const fetcher = jest.fn();
      const onFinish = 'not a function';

      // @ts-ignore
      expect(() => doPolling(fetcher, { onFinish })).toThrow('onFinish must be a function');
    });

    it('should throw an error when onNext is not a function', async () => {
      const fetcher = jest.fn();
      const onNext = 'not a function';

      // @ts-ignore
      expect(() => doPolling(fetcher, { onNext })).toThrow('onNext must be a function');
    });

    it('should throw an error when onComplete is not a function', async () => {
      const fetcher = jest.fn();
      const onComplete = 'not a function';

      // @ts-ignore
      expect(() => doPolling(fetcher, { onComplete })).toThrow('onComplete must be a function');
    });

    it('should throw an error when onError is not a function', async () => {
      const fetcher = jest.fn();
      const onError = 'not a function';

      // @ts-ignore
      expect(() => doPolling(fetcher, { onError })).toThrow('onError must be a function');
    });

    it('should throw an error when onErrorBreak is not a function', async () => {
      const fetcher = jest.fn();
      const onErrorBreak = 'not a function';

      // @ts-ignore
      expect(() => doPolling(fetcher, { onErrorBreak })).toThrow('onErrorBreak must be a function');
    });

    it('should throw an error when breakIfError is not a function', async () => {
      const fetcher = jest.fn();
      const breakIfError = 'not a function';

      // @ts-ignore
      expect(() => doPolling(fetcher, { breakIfError })).toThrow('breakIfError must be a function');
    });

    it('should throw an error when onTooManyErrors is not a function', async () => {
      const fetcher = jest.fn();
      const onTooManyErrors = 'not a function';

      // @ts-ignore
      expect(() => doPolling(fetcher, { onTooManyErrors })).toThrow('onTooManyErrors must be a function');
    });

    it('should throw an error when onTooManyAttempts is not a function', async () => {
      const fetcher = jest.fn();
      const onTooManyAttempts = 'not a function';

      // @ts-ignore
      expect(() => doPolling(fetcher, { onTooManyAttempts })).toThrow('onTooManyAttempts must be a function');
    });

    it('should throw an error when onBreak is not a function', async () => {
      const fetcher = jest.fn();
      const onBreak = 'not a function';

      // @ts-ignore
      expect(() => doPolling(fetcher, { onBreak })).toThrow('onBreak must be a function');
    });

    it('should throw an error when onIntervalError is not a function', async () => {
      const fetcher = jest.fn();
      const onIntervalError = 'not a function';

      // @ts-ignore
      expect(() => doPolling(fetcher, { onIntervalError })).toThrow('onIntervalError must be a function');
    });

    it('should throw an error when abort is not a function', async () => {
      const fetcher = jest.fn();
      const abort = 'not a function';

      // @ts-ignore
      expect(() => doPolling(fetcher, { abort })).toThrow('abort must be a function');
    });
  });
});
