import React from 'react';
import { todoPollingWithStop } from '../service/todo';

export const SubscrtionTrigger = () => {
  const { restart, stop } = todoPollingWithStop;

  const initSubscrtion = () => restart();

  return (
    <>
      <h2>Polling via subscribtion</h2>
      <button onClick={initSubscrtion}>Start polling</button>
      <button onClick={stop}>Stop polling</button>
    </>
  );
};
