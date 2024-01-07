import React, { useState } from 'react';
import { PollingSubscribers } from './PollingSubscribers';
import { RegularPolling } from './RegularPolling';
import { SubscrtionTrigger } from './SubscrtionTrigger';

export default function App() {
  const [checked, setChecked] = useState(true);
  const toggle = (e: React.ChangeEvent<HTMLInputElement>) => setChecked(() => e.target.checked);

  return (
    <div>
      <h1>Hello, Polling Legend</h1>
      <h2>Click this buttons and see results in the console</h2>

      <RegularPolling />
      <SubscrtionTrigger />

      <h2>Below are components subscribed to polling</h2>

      <input type="checkbox" id="checkbox" checked={checked} onChange={toggle} />
      <label htmlFor="checkbox">{checked ? 'Hide' : 'Show'} subscribed components </label>

      <div className="info" style={{ display: checked ? 'block' : 'none' }}>
        <PollingSubscribers key={1} name={1} />
        <PollingSubscribers key={2} name={2} />
        <PollingSubscribers key={3} name={3} />
        <PollingSubscribers key={4} name={4} />
        <PollingSubscribers key={5} name={5} />
        <PollingSubscribers key={6} name={6} />
        <PollingSubscribers key={7} name={7} />
        <PollingSubscribers key={8} name={8} />
        <PollingSubscribers key={9} name={9} />
        <PollingSubscribers key={10} name={10} />
      </div>
    </div>
  );
}
