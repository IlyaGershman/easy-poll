import React, { useRef } from 'react';
import { doPolling } from '../../../../';
import { fetchTodo } from '../service/todo';

let count = 0;
export const RegularPolling = () => {
  const pollingRef = useRef<ReturnType<typeof doPolling>>();
  const shouldStop = useRef(false);

  const poll = () => {
    pollingRef.current?.abort();

    pollingRef.current = doPolling(() => fetchTodo(1), {
      until: props => {
        console.log(`until`, props);

        return count++ === 5;
      },
      breakIf: props => {
        console.log(`breakIf`, props);
        return shouldStop.current;
      },
      onStart: () => {
        console.log(`onStart`, 'onStart');
      },
      onFinish: props => {
        console.log(`onFinish`, props);
        count = 0;
      },
      onNext: props => {
        console.log(`onNext`, props);
      },
      onComplete: props => {
        console.log(`onComplete`, props);
      },
      onError: props => {
        console.log(`onError`, props);
      },
      onBreak(props) {
        console.log(`onBreak`, props);
        shouldStop.current = false;
      },
      onIntervalError(props) {
        console.log(`onIntervalError`, props);
      },
      onTooManyAttempts(props) {
        console.log(`onTooManyAttempts`, props);
      },
      onTooManyErrors(props) {
        console.log(`onTooManyErrors`, props);
      },
      interval: 1000,
    });

    pollingRef.current.init();
  };

  const abortPolling = () => {
    pollingRef.current?.abort();
    shouldStop.current = false;
  };

  const stopPolling = () => {
    shouldStop.current = true;
  };

  return (
    <>
      <button onClick={poll}>Start new polling</button>
      <button onClick={stopPolling}>Stop polling</button>
      <button onClick={abortPolling}>Abort polling</button>
    </>
  );
};
