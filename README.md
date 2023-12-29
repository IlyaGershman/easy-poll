# easy-poll

This is a small lightweight library that should allow you to easily create a polling mechanism and have full controll over it.

Just import the `doPolling` in your project and enjoy the results.

```ts
const { error, data, attempt, attemptsDuration, duration, errorsCount } = await doPolling(fetchStuff, {
  // max retries count. If maxPolls is reached, onTooManyAttempts will be called
  maxPolls: 10,
  // max errors count. If maxErrors is reached, onTooManyErrors will be called
  maxErrors: 5,
  // interval between retries. Can be a number or function that is called on every poll
  interval: 1000,
  // polling will be stopped if the condition is true. If the condition is not provided,
  // polling will be stopped after one successful request
  until: data => data.status === 'SUCCESS',
  // onComplete will be called after polling is completed
  onComplete: ({ data, retry, errorsCount }) => {},
  // polling will be stopped if breakIf is true.
  // This is useful when you want to stop polling if you know that you will never get the result you want.
  breakIf: data => data.received !== total,
  // onBreak will be called if breakIf is true
  onBreak: ({ data, retry, errorsCount }) => {},
  // onStart will be called before polling
  onStart: () => {},
  // onNext will be called after each successful poll, before waiting for the interval
  onNext: ({ data, retry, errorsCount }) => {},
  // onError will be called after each failed poll
  onError: ({ retry, errorsCount, error }) => {},
  // onTooManyAttempts will be called if maxPolls is reached.
  onTooManyAttempts: () => {},
  // onTooManyErrors will be called if maxErrors is reached.
  onTooManyErrors: ({ retry, errorsCount, error }) => {},
});
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

for the more complete spec, you can refer to the `doPolling.test.ts` file.

Please feel free to open any `issues` and suggestions!

try this [sandbox](https://codesandbox.io/p/devbox/dopolling-playground-4l5ct7?embed=1&file=%2Fsrc%2FApp.tsx)
