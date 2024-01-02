import React from 'react';
import { doPolling } from '../../../../';
import { fetchTodo } from '../service/todo';

let count = 0;
export const RegularPolling = () => {
  const init = () =>
    doPolling(() => fetchTodo(1), {
      until: props => {
        console.log(props);

        return count++ === 5;
      },
      breakIf: props => {
        console.log(props);
        return false;
      },
      onStart: () => {
        console.log('onStart');
      },
      onFinish: props => {
        console.log(props);
        count = 0;
      },
      onNext: props => {
        console.log(props);
      },
      onComplete: props => {
        console.log(props);
      },
      onError: props => {
        console.log(props);
      },
      onBreak(props) {
        console.log(props);
      },
      onIntervalError(props) {
        console.log(props);
      },
      onTooManyAttempts(props) {
        console.log(props);
      },
      onTooManyErrors(props) {
        console.log(props);
      },
      interval: 5000,
    });

  return <button onClick={init}>Start polling</button>;
};
