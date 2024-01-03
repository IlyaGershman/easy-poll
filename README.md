# easy-poll

<img src="./badges/badge-functions.svg" /><img src="./badges/badge-branches.svg" /><img src="./badges/badge-lines.svg" /><img src="./badges/badge-statements.svg" />

This is a simple, battle tested and fully typed library that will help you create a polling mechanism and have full controll over it.

## Examples

Less text, more code? We got you:

- [This sandbox](https://codesandbox.io/p/devbox/dopolling-playground-4l5ct7?embed=1&file=%2Fsrc%2FApp.tsx) for react example.

- [This sandbox](https://codesandbox.io/p/devbox/easy-poll-express-sandbox-gjhzt4?file=%2Findex.js%3A23%2C26) for nodejs example.

- You can also check [examples](https://github.com/IlyaGershman/easy-poll/tree/main/examples) folder. See readme files of an example to know how to run it localy.

## Installation

```bash
npm install @ilyagershman/easy-poll
```

```bash
yarn add @ilyagershman/easy-poll
```

```bash
pnpm install @ilyagershman/easy-poll
```

## doPolling()

Just import the `doPolling` in your project and enjoy the results.

```ts
import { doPolling } from '@ilyagershman/easy-poll';

const { error, data, attempt, attemptsDuration, duration, errorsCount } = await doPolling(fetchStuff, {
  // max retries count. If maxPolls is reached, onTooManyAttempts will be called
  maxPolls: 10, // default is Infinity
  // max errors count. If maxErrors is reached, onTooManyErrors will be called
  maxErrors: 5, // default is 5
  // interval between retries. Can be a number or function that is called on every poll
  interval: 1000, // default is 2000
  // polling will be stopped if condition is true. If condition is not provided,
  // polling will be stopped after one successful request
  until: ({ data }) => data.status === 'SUCCESS', // default is () => true
  // polling will be stopped if breakIf is true.
  // This is useful when you want to stop polling if you know that you will never get the result you want.
  breakIf: ({ data }) => data.received !== total,
  // onBreak will be called if breakIf is true
  onBreak: ({ data, attempt, errorsCount }) => {},
  // breakIfError acts the same as breakIf, but for errors. It is useful when you want to stop polling if you receive a specific error type.
  breakIfError: ({ error }) => error.code === 404,
  // onBreakError will be called if breakIfError is true
  onBreakError: ({ error, attempt, errorsCount }) => {},
  // abort can be used to stop polling from the outside at once. No more callbacks will be called.
  abort: ({data, error, attempt }) => data === 'I need your clothes, your boots, and your motorcycle',
  // onStart will be called before polling
  onStart: () => {},
  // onNext will be called after each successful poll, except the last one
  onNext: ({ data, attempt, errorsCount }) => {},
  // onComplete will be called after polling is completed
  onComplete: ({ data, attempt, errorsCount }) => {},
  // onFinish will be called after polling is finished with whichever result
  onFinish: ({ data, attempt, errorsCount }) => {},
  // onError will be called after each failed poll
  onError: ({ retry, errorsCount, error }) => {},
  // onTooManyAttempts will be called if maxPolls is reached.
  onTooManyAttempts: () => {},
  // onTooManyErrors will be called if maxErrors is reached.
  onTooManyErrors: ({ retry, errorsCount, error }) => {},
  // onIntervalError will be called if the interval function throws an error
  onIntervalError({ data, error, attempt, attemptsDuration, errorsCount, duration }) => {}
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

## subscribePolling()

You can also subscribe to the execution of the polling. It uses the same engine under the hood.
When called. the function returns an object with two functions: `subscribe` and `init`.

`init` is a function that starts the polling. It returns a promise with the result of the polling (same as `doPolling`).
Every time polling event is triggered, the callback passed to the `subscribe` function will be called with the event props that are the same as `doPolling` callbacks.

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
  until: ({ data }) => data.status === 'SUCCESS',
  // polling will be stopped if breakIf is true.
  // This is useful when you want to stop polling if you know that you will never get the result you want.
  breakIf: ({ data }) => data.received !== total,
    // breakIfError acts the same as breakIf, but for errors. It is useful when you want to stop polling if you receive a specific error type.
  breakIfError: ({ error }) => error.code === 404,
  // abort can be used to stop polling from the outside at once. No more callbacks will be called.
  abort: ({data, error, attempt }) => data === 'I need your clothes, your boots, and your motorcycle',
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

for the complete spec, you can refer to the `subscribePolling.test.ts` file.

## Issues

Please feel free to open any [issues](https://github.com/IlyaGershman/easy-poll/issues) and suggestions!

## Like this repo?

 ⭐️ this repo, it will help others find it ❤️

## Licence

MIT
