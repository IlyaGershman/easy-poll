import React from 'react';
import { todoPollingWithStop1, todoPollingWithStop2 } from '../service/todo';

export const SubscrtionTrigger = () => {
  const { init: init1, stop: stop1, abort: abort1 } = todoPollingWithStop1;
  const { init: init2, stop: stop2, abort: abort2 } = todoPollingWithStop2;

  const handleInit1 = () => {
    init1().then(d => console.log(`todo1 - done! \n ${JSON.stringify(d, null, 2)}`));
  };
  const handleInit2 = () => {
    init2().then(d => console.log(`todo2 - done! \n ${JSON.stringify(d, null, 2)}`));
  };

  return (
    <>
      <h2>Polling #1 via subscribtion</h2>
      <button onClick={handleInit1}>Start polling</button>
      <button onClick={stop1}>Stop polling</button>
      <button onClick={abort1}>Abort polling</button>

      <h2>Polling #2 via subscribtion</h2>
      <button onClick={handleInit2}>Start polling</button>
      <button onClick={stop2}>Stop polling</button>
      <button onClick={abort2}>Abort polling</button>
    </>
  );
};
