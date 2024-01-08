# easy-poll

<img src="./.badges/badge-functions.svg" /><img src="./.badges/badge-branches.svg" /><img src="./.badges/badge-lines.svg" /><img src="./.badges/badge-statements.svg" />

⭐️ Easy to use, fully typed and well tested web/nodejs library for polling. Examples and sandboxes are included! ⭐️

## Contents

- [Examples](#examples)
- [Installation](#installation)
- [API](#api)
  - [doPolling](#dopolling)
  - [subscribePolling](#subscribepolling)
- [Issues](#issues)
- [Like this repo?](#like-this-repo)
- [Licence](#licence)

## Examples

Less text, more code? We got you:

- [This sandbox](https://codesandbox.io/p/devbox/dopolling-playground-4l5ct7?embed=1&file=%2Fsrc%2FApp.tsx) for react example.

- [This sandbox](https://codesandbox.io/p/devbox/easy-poll-express-sandbox-gjhzt4?file=%2Findex.js%3A23%2C26) for nodejs example. (<strong>Requires NodeJS 16+</strong>)

- You can also check [examples](https://github.com/IlyaGershman/easy-poll/tree/main/examples) folder. See readme files of an example to know how to run it localy.

## Installation

```bash
npm install --save @ilyagershman/easy-poll
```

```bash
yarn add @ilyagershman/easy-poll
```

```bash
pnpm install  --save @ilyagershman/easy-poll
```

## API

easy-poll library exposes two main functions: `doPolling` and `subscribePolling`.

`doPolling` is a function that returns an object with two functions: `init` and `abort`.
`subscribePolling` is a function that returns an object with three functions: `subscribe`, `init` and `abort`.

`init` is a function that starts the polling. It returns a promise with the result of the polling. Calling `init` again will not start a new polling, but will return the same promise as before.

`abort` is a function that aborts the polling. It will make the polling to stop and return the result of the last poll whether it was successful or not.

`subscribe` is a function that accepts a callback function as a parameter. The callback function will be called every time polling event is triggered.

## doPolling()

Import the `doPolling` function from the library and pass it the function that you want to poll. Pass the options object as a second parameter.
Here is an example of how to use it:

```ts
import { doPolling } from '@ilyagershman/easy-poll';

const { init, abort } = await doPolling(fetchStuff,
  {
    // max retries count. If maxPolls is reached, onTooManyAttempts will be called
    maxPolls: 10, // default is Infinity
    // max errors count. If maxErrors is reached, onTooManyErrors will be called
    maxErrors: 5, // default is 5
    // interval between retries. Can be a number or function that is called on every poll
    interval: 1000, // default is 2000
    // polling will be stopped if condition is true. If condition is not provided, polling will be stopped after one successful request
    until: ({ data }) => data.status === 'SUCCESS', // default is () => true
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
    onIntervalError({ data, error, attempt, attemptsDuration, errorsCount, duration }) => {},
    // polling will be stopped if breakIf is true. This is useful when you want to stop polling if you know that you will never get the result you want.
    breakIf: ({ data }) => data.received !== total,
    // onBreak will be called if breakIf is true
    onBreak: ({ data, attempt, errorsCount }) => {},
    // breakIfError acts the same as breakIf, but for errors. It is useful when you want to stop polling if you receive a specific error type.
    breakIfError: ({ error }) => error.code === 404,
    // onBreakError will be called if breakIfError is true
    onBreakError: ({ error, attempt, errorsCount }) => {},
  }
);

// now simply call init to start polling
init().then(({ error, data }) => {
  // data is the result of the last poll (if it was successful)
  // error is the error of the last poll (if it was failed)
});

// you can also abort the polling from the outside
addEventListener('click', () => abort());
```

As you can see, you have a lot of control over the polling process. But all the options props are optional, you can simply use it like this:

```ts
doPolling(fetchStuff).init().then(...); // this will act like a simple fetch with 5 retries
```

or provide only the `until` condition:

```ts
const { data, error } = await doPolling(fetchStuff, { until: ({ data }) => data === 'the needed result' }).init();
```

you also have a fine control of the interval of the polling. With this you can create your own strategy for the use-case

```ts
doPolling(fetchStuff, {
  until: ({ data }) => data === 'the needed result',
  interval: ({ data, attempt }) => attempt * 1000, // now every attempt is going to be less and less frequent
});
```

or

```ts
interval: () => getRandomNumber(100, 6000), // super sneaky strategy - not even you will know when the next attempt is going to be. How do you like that, Elon Musk?
```

or even

```ts
interval: ({ error }) => (!!error ? 42000 : 4200), // let's introduce some cooldown period after an error
```

for more complete spec, you can refer to the `doPolling.test.ts` file. Or check the [examples](https://github.com/IlyaGershman/easy-poll/tree/main/examples)

## subscribePolling()

This function is useful when you want to react on the polling events from the outside. In that case you can subscribe to the execution of the polling.
When called, the function returns an object with two functions: `subscribe`, `init` and `abort`.

`init` is a function that starts the polling. It returns a promise with the result of the polling (same as `doPolling`).
Every time polling event is triggered, the callback passed to the `subscribe` function will be called. The callback function will receive an object with the following properties:

```ts
{
  event: EVENTS; // the name of the event
  props: {
    // same props as every doPolling callbacks receive
    data: any; // the result of the last poll (if it was successful)
    error: any; // the error of the last poll (if it was failed)
    attempt: number; // the number of the current attempt
    attemptsDuration: number; // the duration of all attempts
    errorsCount: number; // the number of errors
    duration: number; // the duration of the polling
  }
}
```

Consider the following example:

```ts
// someService.ts
import { subscribePolling } from '@ilyagershman/easy-poll';

export const { subscribe, init, abort } = subscribePolling(fetchStuff, {
  // max retries count. If maxPolls is reached, onTooManyAttempts will be called
  maxPolls: 10,
  // max errors count. If maxErrors is reached, onTooManyErrors will be called
  maxErrors: 5,
  // interval between retries. Can be a number or function that is called on every poll
  interval: () => getRandomInt(10000),
  // polling will be stopped if the condition is true. If the condition is not provided, polling will be stopped after one successful request
  until: ({ data }) => data.status === 'SUCCESS',
  // polling will be stopped if breakIf is true. This is useful when you want to stop polling if you know that you will never get the result you want.
  breakIf: ({ data }) => data.received !== total,
  // breakIfError acts the same as breakIf, but for errors. It is useful when you want to stop polling if you receive a specific error type.
  breakIfError: ({ error }) => error.code === 404,
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

/// somewhereElse.ts in your code react on the polling events.
import { abort } from './somewhere';

// this will abort the polling after some time
setTimeout(abort, 4200);

```

for the complete spec, you can refer to the `subscribePolling.test.ts` file. Or check the [examples](https://github.com/IlyaGershman/easy-poll/tree/main/examples)

## Issues

Please feel free to open any [issues](https://github.com/IlyaGershman/easy-poll/issues) and suggestions!

## Like this repo?

⭐️ this repo, it will help others find it ❤️

## Licence

[MIT](./LICENCE.md)
