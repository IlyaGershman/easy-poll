/* eslint-disable @typescript-eslint/ban-ts-comment */
import React, { createContext, useContext, useEffect, useState } from 'react';
import { EVENTS, doPolling, subscribePolling } from '../../../src/index';

window.process = {
  // @ts-ignore
  env: 'example',
};

const fetchSomeData = () => {
  const url = 'https://jsonplaceholder.typicode.com/todos/1';

  return fetch(url).then(response => response.json());
};

const fetchSomeData2 = () => {
  const url = 'https://jsonplaceholder.typicode.com/todos/2';

  return fetch(url).then(response => response.json());
};

const createPollSubscription = () => {
  const stop = Date.now() + 10000;
  return subscribePolling(fetchSomeData2, {
    interval: () => getRandomInt(4000), // sneaky strategy
    until: () => false,
    breakIf: () => Date.now() > stop,
  });
};

let count = 0;

export default function App() {
  const [checked, setChecked] = useState(true);
  const init = () =>
    doPolling(fetchSomeData, {
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
      onFinish: () => {
        console.log('onFinish');
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

  const init2 = () => {
    const { subscribe } = createPollSubscription();

    subscribe(props => {
      console.log(JSON.stringify(props, null, 2));
    });
  };

  return (
    <div className="App">
      <h1>Hello Polling Legend</h1>
      <h2>Click this buttons and see results in the console</h2>
      <button onClick={init}>Start polling</button>
      <button onClick={init2}>Start polling with subscription</button>

      <h2>Below are components subscribed to polling</h2>

      <input
        type="checkbox"
        id="checkbox"
        checked={checked}
        onChange={e => {
          setChecked(() => e.target.checked);
        }}
      />
      <label htmlFor="checkbox"> Show subscribed components </label>

      <PollingDataProvider>
        <div className="info" style={{ display: checked ? 'block' : 'none' }}>
          <InfoField key={1} name={1} />
          <InfoField key={2} name={2} />
          <InfoField key={3} name={3} />
          <InfoField key={4} name={4} />
          <InfoField key={5} name={5} />
          <InfoField key={6} name={6} />
          <InfoField key={7} name={7} />
          <InfoField key={8} name={8} />
          <InfoField key={9} name={9} />
          <InfoField key={10} name={10} />
        </div>
      </PollingDataProvider>
    </div>
  );
}

const emptyData = Object.fromEntries(Object.keys(EVENTS).map(e => [e, [] as string[]]));

const InfoField = ({ name }: { name: number }) => {
  const { subscribe } = usePollingData();
  const [data, setData] = useState(emptyData);

  useEffect(() => {
    const { unsubscribe } = subscribe(props => {
      const str = JSON.stringify(props, null, 2);
      setData(prev => ({
        ...prev,
        // eslint-disable-next-line react/prop-types
        [props.event]: [...prev[props.event], str],
      }));
    });

    return () => {
      unsubscribe();
    };
  }, [subscribe]);

  return (
    <>
      <h3>Subscribed Component #{name}</h3>
      <table>
        <thead>
          <tr>
            {Object.values(EVENTS).map(e => (
              <th key={e}>{e}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            {Object.values(EVENTS).map(e => (
              <td key={e}>
                <pre className="mypre">
                  <strong>{data[e] ? data[e].map((d, i) => <div key={i}>{d}</div>) : ''}</strong>
                </pre>
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </>
  );
};

function getRandomInt(max: number) {
  return Math.floor(Math.random() * max);
}

export interface PollingDataContextValue {
  subscribe: ReturnType<typeof subscribePolling>['subscribe'];
}

export const PollingDataContext = createContext<PollingDataContextValue | undefined>(undefined);

export function PollingDataProvider({ children }: { children: React.ReactNode }) {
  const [polling] = useState(createPollSubscription());

  return <PollingDataContext.Provider value={{ subscribe: polling.subscribe }}>{children}</PollingDataContext.Provider>;
}

export function usePollingData() {
  const context = useContext(PollingDataContext);

  if (!context) {
    throw new Error('usePollingData must be used within a PollingDataProvider');
  }

  return context;
}
