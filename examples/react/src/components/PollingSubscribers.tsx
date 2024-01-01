import React, { useEffect, useState } from 'react';
import { EVENTS } from '../../../../src/index';
import { todoPollingWithStop } from '../service/todo';

const getEmptyData = () => Object.fromEntries(Object.keys(EVENTS).map(e => [e, [] as string[]]));
export const PollingSubscribers = ({ name }: { name: number }) => {
  const { subscribe } = todoPollingWithStop;
  const [data, setData] = useState(getEmptyData());

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
