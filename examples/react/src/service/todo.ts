/* eslint-disable @typescript-eslint/ban-ts-comment */
import { subscribePolling } from '../../../../';
import { getRandomInt } from '../utils/getRandomInt';

// @ts-ignore
window.process = { env: 'example' };

export const fetchTodo = (id: number) => {
  const url = `https://jsonplaceholder.typicode.com/todos/${id}`;

  return fetch(url).then(response => response.json());
};

export const createPollSubscriptionWithStop = () => {
  const signal = { stop: false };

  const stop = () => (signal.stop = true);

  const { subscribe, init, abort } = subscribePolling(() => fetchTodo(2), {
    interval: () => getRandomInt(6000), // sneaky strategy
    until: () => false,
    breakIf: () => !!signal.stop,
    breakIfError: () => !!signal.stop,
    maxErrors: 42,
    maxPolls: 42,
  });

  return { subscribe, init, stop, abort };
};

export const todoPollingWithStop1 = createPollSubscriptionWithStop();
export const todoPollingWithStop2 = createPollSubscriptionWithStop();
