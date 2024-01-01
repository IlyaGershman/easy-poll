# easy-poll

<img src="./badges/badge-functions.svg" /><img src="./badges/badge-branches.svg" /><img src="./badges/badge-lines.svg" /><img src="./badges/badge-statements.svg" />

This is a small lightweight and fully typed library that should allow you to easily create a polling mechanism and have full controll over it.

Less text, more code? We got you. [Try this sandbox](https://codesandbox.io/p/devbox/dopolling-playground-4l5ct7?embed=1&file=%2Fsrc%2FApp.tsx)

### <h1>doPolling()</h1>

Just import the `doPolling` in your project and enjoy the results.

```ts
import { doPolling } from '@ilyagershman/easy-poll';

const { error, data, attempt, attemptsDuration, duration, errorsCount } = await doPolling(fetchStuff, {
  // max retries count. If maxPolls is reached, onTooManyAttempts will be called
  maxPolls: 10,
  // max errors count. If maxErrors is reached, onTooManyErrors will be called
  maxErrors: 5,
  // interval between retries. Can be a number or function that is called on every poll
  interval: 1000,
  // polling will be stopped if condition is true. If condition is not provided,
  // polling will be stopped after one successful request
  until: data => data.status === 'SUCCESS',
  // onComplete will be called after polling is completed
  onComplete: ({ data, attempt, errorsCount }) => {},
  // polling will be stopped if breakIf is true.
  // This is useful when you want to stop polling if you know that you will never get the result you want.
  breakIf: data => data.received !== total,
  // onBreak will be called if breakIf is true
  onBreak: ({ data, attempt, errorsCount }) => {},
  // onStart will be called before polling
  onStart: () => {},
  // onFinish will be called after polling is finished with whichever result
  onFinish: ({ data, attempt, errorsCount }) => {},
  // onNext will be called after each successful poll, except the last one
  onNext: ({ data, attempt, errorsCount }) => {},
  // onError will be called after each failed poll
  onError: ({ retry, errorsCount, error }) => {},
  // onTooManyAttempts will be called if maxPolls is reached.
  onTooManyAttempts: () => {},
  // onTooManyErrors will be called if maxErrors is reached.
  onTooManyErrors: ({ retry, errorsCount, error }) => {},
  // onIntervalError will be called if the interval function throws an error
  onIntervalError({ data, error, attempt ,attemptsDuration, errorsCount, duration }) => {}
);
```

all the options props are optional, you can simply use it like this:

```ts
doPolling(fetchStuff).then(...);
```

or provide only the `until` condition:

```ts
const { data, error } = await doPolling(fetchStuff, { until: ({ data }) => data === 'the needed result' });
```

you also have a fine control of the interval of the polling. With this you can create your own strategy for the use-case

```ts
await doPolling(fetchStuff, {
  until: ({ data }) => data === 'the needed result',
  interval: ({ data, attempt }) => attempt * 1000, // now every attempt is going to be less and less frequent
});
```

for more complete spec, you can refer to the `doPolling.test.ts` file.

### <h2>subscribePolling()</h2>

You can also subscribe to the execution of the polling. It uses the same engine under the hood.
When called. the function returns an object with two functions: `subscribe` and `init`.

`init` is a function that starts the polling. It returns a promise with the result of the polling (same as `doPolling`).
Every time polling event is triggered, the `subscribe` function will be called with the event props that are the same as `doPolling` callbacks.

```ts
// someService.ts
import { subscribePolling } from '@ilyagershman/easy-poll';

export const { subscribe, init } = subscribePolling(fetchStuff, {
  // max retries count. If maxPolls is reached, onTooManyAttempts will be called
  maxPolls: 10,
  // max errors count. If maxErrors is reached, onTooManyErrors will be called
  maxErrors: 5,
  // interval between retries. Can be a number or function that is called on every poll
  interval: () => getRandomInt(10000),
  // polling will be stopped if the condition is true. If the condition is not provided,
  // polling will be stopped after one successful request
  until: data => data.status === 'SUCCESS',
  // polling will be stopped if breakIf is true.
  // This is useful when you want to stop polling if you know that you will never get the result you want.
  breakIf: data => data.received !== total,
});

/// somewhere.ts in your code react on the polling events.
import { subscribe, init } from './somewhere';
import { EVENTS } from '@ilyagershman/easy-poll';

init().then({ data, error } => {
  // same as doPolling
}));

subscribe(props => {
  if (props.event === EVENTS.ON_COMPLETE) onComplete(props);
  if (props.event === EVENTS.ON_BREAK) onBreak(props);
  if (props.event === EVENTS.ON_NEXT) onNext(props);
  if (props.event === EVENTS.ON_ERROR) onError(props);
  if (props.event === EVENTS.ON_FINISH) onFinish(props);
  if (props.event === EVENTS.ON_TOOMANYERRORS) onTooManyErrors(props);
  if (props.event === EVENTS.ON_TOOMANYATTEMPTS) onTooManyAttempts(props);
  // ...
});
```

You can check `examples` folder for a working example. Check out readme there the start the example project.

for the complete spec, you can refer to the `subscribePolling.test.ts` file.

### Issues

Please feel free to open any [issues](https://github.com/IlyaGershman/easy-poll/issues) and suggestions!

## Licence

MIT
