import { subscribePolling } from '../../../../';
import { getRandomInt } from '../utils/getRandomInt';

export const fetchTodo = (id: number) => {
  const url = `https://jsonplaceholder.typicode.com/todos/${id}`;

  return fetch(url).then(response => response.json());
};

export const createPollSubscriptionWithTimeLimit = () => {
  const stop = Date.now() + 10000;
  return subscribePolling(() => fetchTodo(2), {
    interval: () => getRandomInt(4000), // sneaky strategy
    until: () => false,
    breakIf: () => Date.now() > stop,
  });
};

export const createPollSubscriptionWithStop = () => {
  const signal = { stop: false };

  const stop = () => (signal.stop = true);

  const { subscribe, init } = subscribePolling(() => fetchTodo(2), {
    interval: () => getRandomInt(4000), // sneaky strategy
    until: () => false,
    breakIf: () => !!signal.stop,
  });

  const restart = () => {
    signal.stop = false;
    init();
  };

  return { subscribe, restart, stop };
};

export const todoPolling = createPollSubscriptionWithTimeLimit();
export const todoPollingWithStop = createPollSubscriptionWithStop();
