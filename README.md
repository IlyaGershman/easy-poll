# Welcome to easy-poll

<img src="./.badges/badge-functions.svg" /><img src="./.badges/badge-branches.svg" /><img src="./.badges/badge-lines.svg" /><img src="./.badges/badge-statements.svg" />

🌟 Dive into the world of effortless, fully-typed, and rigorously tested polling with easy-poll! Including hands-on examples and interactive sandboxes to kickstart your development. 🌟

## Contents
- [Welcome to easy-poll](#welcome-to-easy-poll)
- [Quick Start with Examples](#quick-start-with-examples)
- [Installation Guide](#installation-guide)
- [API Overview](#api-overview)
  - [`doPolling`](#dopolling)
  - [`subscribePolling`](#subscribepolling)
- [Understanding `doPolling()`](#understanding-dopolling)
  - [Basic Usage](#basic-usage)
  - [Options API](#options-api)
    - [`maxPolls`](#maxpolls)
    - [`maxErrors`](#maxerrors)
    - [`interval`](#interval)
    - [`until`](#until)
    - [`onStart`](#onstart)
    - [`onNext`](#onnext)
    - [`onComplete`](#oncomplete)
    - [`onFinish`](#onfinish)
    - [`onError`](#onerror)
    - [`onTooManyAttempts`](#ontoomanyattempts)
    - [`onTooManyErrors`](#ontoomanyerrors)
    - [`onIntervalError`](#onintervalerror)
    - [`breakIf`](#breakif)
    - [`onBreak`](#onbreak)
    - [`breakIfError`](#breakiferror)
    - [`onBreakError`](#onbreakerror)
- [Understanding `subscribePolling()`](#understanding-subscribepolling)
- [How to Abort Polling](#how-to-abort-polling)
  - [Using `abort` in `doPolling`](#using-abort-in-dopolling)
  - [Using `abort` in `subscribePolling`](#using-abort-in-subscribepolling)
  - [Passing Abort Signal to Fetch](#passing-abort-signal-to-fetch)
- [Support and Feedback](#support-and-feedback)
- [Real-World Examples](#real-world-examples)
  - [E-commerce Inventory Check](#e-commerce-inventory-check)
  - [Social Media Feed Update](#social-media-feed-update)
  - [Monitoring System Status](#monitoring-system-status)
  - [Real-Time Stock Market Updates](#real-time-stock-market-updates)
  - [Tracking Parcel Delivery Status](#tracking-parcel-delivery-status)
  - [Automated Help Desk Ticket Updates](#automated-help-desk-ticket-updates)
  - [Real-Time Chat Application](#real-time-chat-application)
  - [Live Sports Score Updates](#live-sports-score-updates)
  - [Monitoring Server Performance](#monitoring-server-performance)
- [Licence](#licence)

## Quick Start with Examples

Jump straight into action with our live examples:

- **For React Users:** Explore our React integration with this [interactive sandbox](https://codesandbox.io/p/devbox/dopolling-playground-4l5ct7?embed=1&file=%2Fsrc%2FApp.tsx).

- **For Node.js Users:** Check out how easy-poll works in a Node.js environment with this [node example sandbox](https://codesandbox.io/p/devbox/easy-poll-express-sandbox-gjhzt4?file=%2Findex.js%3A23%2C26). (Note: NodeJS 16+ required)

- **More Examples:** Visit the [examples directory](https://github.com/IlyaGershman/easy-poll/tree/main/examples) on our GitHub repository for a variety of use cases. Each example includes a README for guidance on running it locally.


## Installation Guide

Get started with easy-poll in your project by running one of the following commands:

For npm users:

```bash
npm install --save @ilyagershman/easy-poll
```

For yarn users:

```bash
yarn add @ilyagershman/easy-poll
```

For pnpm users:

```bash
pnpm install --save @ilyagershman/easy-poll
```

Choose the command compatible with your package manager to add easy-poll to your project dependencies.

## API Overview

The `easy-poll` library offers two primary functions to cater to your polling needs: `doPolling` and `subscribePolling`.

### `doPolling`

This function initiates a polling process, returning an object that includes `init` and `abort` methods:

- `init`: Starts the polling sequence and returns a promise with the polling result. Re-invoking `init` will return the initial promise instead of creating a new polling instance.
- `abort`: Stops the polling process and returns the promise with the result of the last poll, regardless of success or failure.

### `subscribePolling`

This function is designed for scenarios where you want to monitor polling events externally, returning an object with `subscribe`, `init`, and `abort` methods:

- `subscribe`: Registers a callback to be invoked on each polling event, receiving data about the polling status.
- `init`: Similar to `doPolling`, it begins the polling and returns a promise with the outcome.
- `abort`: Ends the polling and provides the promise with the last known state of the polling process.

Both functions allow for detailed configuration to fine-tune the polling behavior, including retry limits, error handling, polling intervals, and custom event callbacks.

## Understanding `doPolling()`

Import the `doPolling` function from the library and pass it the function that you want to poll. Pass the options object as a second parameter. Here is an example of how to use it:

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

### Basic Usage
As you can see, you have a lot of control over the polling process. But all the options props are optional, you can simply use it like this:

```ts
doPolling(fetchStuff).init().then(...); // this will act like a simple fetch with 5 retries
```

or provide only the `until` condition:

```ts
const { data, error } = await doPolling(fetchStuff, { until: ({ data }) => data === 'the needed result' }).init();
```

### Options API
Here's a detailed description of each property in the `doPolling` function's options object:

#### `maxPolls`
- **Type:** `number`
- **Default:** `Infinity`
- **Description:** The maximum number of times to attempt polling. When this count is reached, `onTooManyAttempts` is triggered.

#### `maxErrors`
- **Type:** `number`
- **Default:** `5`
- **Description:** The maximum number of errors allowed before stopping the polling. `onTooManyErrors` is called when this limit is reached.

#### `interval`
- **Type:** `number | ((context: PollingContext) => number)`
- **Default:** `2000`
- **Description:** The time interval (in milliseconds) between polling attempts. It can be a constant value or a function that returns a value, allowing dynamic adjustment based on previous attempts or conditions. With this you can create your own strategy for the use-case

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

#### `until`
- **Type:** `((context: PollingContext) => boolean)`
- **Default:** `() => true`
- **Description:** A function that evaluates whether the polling should stop based on the fetched data. If the function returns `true`, polling stops.

#### `onStart`
- **Type:** `() => void`
- **Description:** A callback function that is executed before the polling starts.

#### `onNext`
- **Type:** `((context: PollingContext) => void)`
- **Description:** A callback function called after each successful polling attempt, except for the last one.

#### `onComplete`
- **Type:** `((context: PollingContext) => void)`
- **Description:** A callback function executed when the polling successfully completes.

#### `onFinish`
- **Type:** `((context: PollingContext) => void)`
- **Description:** A callback function called after the polling process finishes, regardless of the outcome.

#### `onError`
- **Type:** `((context: PollingErrorContext) => void)`
- **Description:** A callback function triggered after each failed polling attempt.

#### `onTooManyAttempts`
- **Type:** `() => void`
- **Description:** A callback function called when the number of polling attempts exceeds `maxPolls`.

#### `onTooManyErrors`
- **Type:** `((context: PollingErrorContext) => void)`
- **Description:** A callback function triggered when the number of errors reaches `maxErrors`.

#### `onIntervalError`
- **Type:** `((context: PollingIntervalErrorContext) => void)`
- **Description:** A callback function called if an error occurs within the interval function.

#### `breakIf`
- **Type:** `((context: PollingContext) => boolean)`
- **Description:** A condition that, if true, stops the polling process immediately. Useful for ending polling based on certain data conditions.

#### `onBreak`
- **Type:** `((context: PollingContext) => void)`
- **Description:** A callback function executed when polling is stopped by `breakIf`.

#### `breakIfError`
- **Type:** `((context: PollingErrorContext) => boolean)`
- **Description:** Similar to `breakIf`, but specifically for halting polling due to certain types of errors.

#### `onBreakError`
- **Type:** `((context: PollingErrorContext) => void)`
- **Description:** A callback function called when `breakIfError` condition is met.

These properties provide a granular level of control over the polling process, allowing developers to precisely manage how polling behaves in different scenarios, handle errors effectively, and implement custom logic at various stages of the polling lifecycle.

In the context of the `doPolling` function, `PollingErrorContext` and `PollingContext` provide specific details about the polling state and error conditions. Here’s how these contexts are structured and what information they provide:

### `PollingContext`

This context is passed to various callback functions to provide information about the current state of the polling process.

```ts
interface PollingContext {
    data: any; // The data returned from the polling function if successful
    attempt: number; // The current attempt count
    errorsCount: number; // The total number of errors encountered so far
    attemptsDuration: number[]; // The total time spent in attempts so far
    duration: number; // The total duration of the polling process, including intervals
}
```

- `data`: Contains the result of the latest successful polling request.
- `attempt`: Indicates which polling attempt is currently being processed.
- `errorsCount`: Counts how many errors have occurred during the polling process.
- `attemptsDuration`: Measures the total time spent on making the polling attempts.
- `duration`: Represents the total time from the start of the polling process, including the time spent waiting between attempts.

### `PollingErrorContext`

This context is specifically used in error-related callbacks to provide details about the error condition within the polling process.

```ts
interface PollingErrorContext extends PollingContext {
    error: any; // The error object or message from the latest failed polling attempt
}
```

- `error`: Provides the error that occurred during the latest polling attempt. This extends `PollingContext`, meaning it includes all the fields from `PollingContext`, along with the error information.

These contexts are designed to give detailed insights into the polling process, allowing developers to implement sophisticated logic in their callbacks, handling success and failure cases effectively, and making informed decisions based on the current state of the polling operation.

## Understanding `subscribePolling()`

subscribePolling is designed for situations where you need to respond to events during the polling process. It allows you to subscribe to polling events and handle them accordingly.
When called, the function returns an object with two functions: `subscribe`, `init` and `abort`.

`init` is a function that starts the polling. It returns a promise with the result of the polling (same as `doPolling`).
Every time polling event is triggered, the callback passed to the `subscribe` function will be called. The callback function will receive an object with the following properties:

```ts
{
  event: EVENTS; // the name of the event. Simply import { EVENTS } from '@ilyagershman/easy-poll'
  props: PollingContext | PollingErrorContext
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

## How to Abort Polling

To terminate an ongoing polling process in `easy-poll`, you can use the `abort` method provided by both `doPolling` and `subscribePolling`. This method stops the polling immediately and returns the state at the time of abortion.

### Using `abort` in `doPolling`

When you initiate polling with `doPolling`, it returns an object containing the `abort` function among others. Here’s how you can use it:

```ts
import { doPolling } from '@ilyagershman/easy-poll';

const { init, abort } = await doPolling(yourFunctionToPoll);

// Start polling
init();

// To abort polling, simply call the abort method
abort();
```

### Using `abort` in `subscribePolling`

Similarly, when using `subscribePolling`, you also get an `abort` function that you can call to stop the polling:

```ts
import { subscribePolling } from '@ilyagershman/easy-poll';

const { init, abort } = subscribePolling(yourFunctionToPoll);

// Start polling
init();

// To abort polling, call the abort method
abort();
```

### Handling Abort in Your Application

You can tie the `abort` function to user actions or application events. For example, you might want to abort the polling when the user navigates away from a page or when a certain condition is met:

```ts
addEventListener('unload', abort); // Abort polling when the user leaves the page
```

Or, in a React component, you might use it in a `useEffect` cleanup function:

```ts
useEffect(() => {
  init(); // Start polling on component mount
  return () => {
    abort(); // Abort polling on component unmount
  };
}, []);
```

Using the `abort` method provides you with the flexibility to manage the polling process according to your application’s needs, ensuring that resources are not wasted and that the application behaves predictably.

To enhance the control over network requests during polling, `easy-poll` allows you to pass an `abort` signal to the `fetch` function. This enables you to cancel ongoing network requests if the polling is aborted.

#### Passing Abort Signal to Fetch

When you initialize the polling, you can pass a function that includes the `signal` parameter. This `signal` should then be passed to the `fetch` function to allow request cancellation:

```ts
import { doPolling } from '@ilyagershman/easy-poll';

const { init, abort } = await doPolling(({ signal }) => fetch('https://api.example.com/data', { signal }));

// Start polling
init();

// The fetch request can now be aborted by calling the abort function
addEventListener('click', abort);  // For example, abort on a button click
```

In this example, `signal` is an instance of `AbortSignal`, which is part of the `AbortController` Web API. By passing this `signal` to the `fetch` call, you link the abort control of the polling process directly to the network request.

### Benefits of Using Abort Signal

1. **Immediate Termination:** When `abort` is called, it not only stops the polling but also immediately cancels any ongoing `fetch` request.
2. **Resource Optimization:** Prevents unnecessary network traffic and load on the server by stopping requests that are no longer needed.
3. **Better Error Handling:** Facilitates cleaner and more manageable error handling by distinguishing between user-aborted requests and other types of network errors.

This integration ensures that your polling logic is efficient, responsive, and respectful of both client and server resources.

You can learn more about AbortControllers and Signals [here](https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal) and [here](https://developer.mozilla.org/en-US/docs/Web/API/fetch#signal).

## Support and Feedback

Do you have questions or need assistance with `easy-poll`? Your feedback and inquiries are welcome!

### Opening an Issue

If you encounter any problems or have suggestions for improving `easy-poll`, please feel free to open an issue on our GitHub repository:

- [Open an Issue](https://github.com/IlyaGershman/easy-poll/issues)

### Get Involved

Your contributions make `easy-poll` better for everyone. Whether it's reporting bugs, discussing new features, or improving documentation, we value your input and encourage your participation.

### Stay Connected

Join our community and stay up-to-date with the latest developments. Your insights and expertise can help shape the future of `easy-poll`!

By engaging with the community, you can help improve the tool and find support for any challenges you encounter.

### Spread the Word

Help us grow by sharing `easy-poll` within your network:

- **Star the Repo:** Click the star button on GitHub to increase visibility.
- **Share on Social Media:** Let others know about `easy-poll` on Twitter, LinkedIn, or your favorite tech community.
- **Recommend to Peers:** If `easy-poll` has made your development process easier, recommend it to colleagues and friends.

### Why Your Support Matters

Your endorsement not only motivates us to improve and expand `easy-poll` but also helps build a community around it. A larger community means more ideas, feedback, and contributions, leading to a robust and feature-rich library.

Thank you for considering to support and share `easy-poll`. Together, we can make it an indispensable tool for developers everywhere!


## Real-World Examples

### E-commerce Inventory Check
An e-commerce application needs to regularly check the availability of a high-demand product. To prevent overwhelming the server, the app uses `doPolling` to check inventory status every 30 seconds, increasing the interval after each attempt until a successful response is received or a maximum of 10 attempts is reached.

```ts
import { doPolling } from '@ilyagershman/easy-poll';

async function checkProductAvailability(productId) {
    const response = await fetch(`https://api.store.com/products/${productId}/availability`);
    return response.json();
}

const { init, abort } = doPolling(() => checkProductAvailability('12345'), {
    maxPolls: 10,
    interval: (attempt) => 30000 + (attempt * 5000), // Increase interval by 5 seconds after each attempt
    until: ({ data }) => data.isAvailable,
});

init().then(({ data }) => {
    if (data.isAvailable) {
        console.log('Product is available!');
    }
});
```

### Social Media Feed Update
A social media application wants to update the user's feed only when new content is available. Using `doPolling`, it can efficiently poll the server for updates without constant querying, reducing unnecessary network usage.

```ts
import { doPolling } from '@ilyagershman/easy-poll';

function fetchNewSocialMediaPosts(lastUpdate) {
    return fetch(`https://api.socialmedia.com/posts?since=${lastUpdate}`)
        .then(res => res.json());
}

const { init } = doPolling(() => fetchNewSocialMediaPosts(lastFetchTimestamp), {
    interval: 60000, // Check every minute
    until: ({ data }) => data.length > 0,
});

init().then(({ data }) => {
    console.log('New posts:', data);
    lastFetchTimestamp = new Date().toISOString(); // Update last fetch timestamp
});
```

### Monitoring System Status
For a system monitoring tool, it’s crucial to continuously check the health of various services. `doPolling` can be used to implement this functionality, with the ability to break the polling process if a critical error is detected.

```ts
import { doPolling } from '@ilyagershman/easy-poll';

async function checkSystemHealth() {
    const response = await fetch('https://api.system.com/health');
    return response.json();
}

const { init, abort } = doPolling(checkSystemHealth, {
    interval: 5000, // Poll every 5 seconds
    breakIfError: ({ error }) => error.statusCode === 500, // Stop polling on critical errors
});

init().then(({ data }) => {
    if (data.status === 'OK') {
        console.log('System is healthy!');
    }
});

addEventListener('unload', abort); // Abort polling when the user leaves the page
```

### Real-Time Stock Market Updates
A financial application tracks real-time changes in stock prices. To provide timely updates without overloading the server, `doPolling` can be set to poll the server at a higher frequency during market hours and less frequently after hours.

```ts
import { doPolling } from '@ilyagershman/easy-poll';

function fetchStockPrice(stockSymbol) {
    return fetch(`https://api.finance.com/stocks/${stockSymbol}`)
        .then(res => res.json());
}

const { init } = doPolling(() => fetchStockPrice('AAPL'), {
    interval: ({ attempt, errorsCount }) => {
        const isMarketHours = new Date().getHours() >= 9 && new Date().getHours() < 16;
        return isMarketHours ? 1000 : 60000; // 1 second during market hours, 1 minute otherwise
    },
});

init().then(({ data }) => {
    console.log('Latest stock price:', data.price);
});
```

### Tracking Parcel Delivery Status
For a logistics application, customers want to track their parcel delivery status in real-time. `doPolling` can help by polling the delivery service's API until the parcel status changes to "Delivered".

```ts
import { doPolling } from '@ilyagershman/easy-poll';

function checkParcelStatus(parcelId) {
    return fetch(`https://api.logistics.com/parcels/${parcelId}/status`)
        .then(res => res.json());
}

const { init } = doPolling(() => checkParcelStatus('123456789'), {
    until: ({ data }) => data.status === 'Delivered',
    interval: 30000, // Check every 30 seconds
});

init().then(() => {
    console.log('Parcel has been delivered!');
});
```

### Automated Help Desk Ticket Updates
In a customer service application, `doPolling` can be used to automatically update the status of help desk tickets, ensuring that service agents and customers have the most current information without manual refreshing.

```ts
import { doPolling } from '@ilyagershman/easy-poll';

function fetchTicketStatus(ticketId) {
    return fetch(`https://api.helpdesk.com/tickets/${ticketId}/status`)
        .then(res => res.json());
}

const { init, abort } = doPolling(() => fetchTicketStatus('ticket-1234'), {
    interval: 10000, // Poll every 10 seconds
    until: ({ data }) => data.status === 'Resolved',
});

init().then(({ data }) => {
    console.log(`Ticket status: ${data.status}`);
});
```

These examples demonstrate how `doPolling` can be adapted to various real-world scenarios, providing a robust solution for different polling requirements.

### Real-Time Chat Application
In a chat application, `subscribePolling` can be used to fetch new messages periodically, updating the chat interface in real time as new messages arrive.

```ts
import { subscribePolling, EVENTS } from '@ilyagershman/easy-poll';

function fetchNewMessages(chatId) {
    return fetch(`https://api.chatapp.com/chats/${chatId}/messages`)
        .then(res => res.json());
}

const { subscribe, init } = subscribePolling(() => fetchNewMessages('chat123'), {
    interval: 5000, // Check for new messages every 5 seconds
});

init();

subscribe(({ event, props }) => {
    if (event === EVENTS.ON_NEXT) {
        updateChatUI(props.data); // Update the UI with new messages
    }
});
```

### Live Sports Score Updates
For a sports app, `subscribePolling` can be utilized to continuously check for and display updated scores of ongoing games, providing fans with real-time score updates.

```ts
import { subscribePolling, EVENTS } from '@ilyagershman/easy-poll';

function fetchCurrentGameScore(gameId) {
    return fetch(`https://api.sports.com/games/${gameId}/score`)
        .then(res => res.json());
}

const { subscribe, init } = subscribePolling(() => fetchCurrentGameScore('game123'), {
    interval: 30000, // Update every 30 seconds
});

init();

subscribe(({ event, props }) => {
    if (event === EVENTS.ON_NEXT) {
        displayScore(props.data); // Display the latest score on the screen
    }
});
```

### Monitoring Server Performance
In an IT infrastructure management tool, `subscribePolling` can be employed to monitor server performance metrics and trigger alerts or actions based on specific thresholds.

```ts
import { subscribePolling, EVENTS } from '@ilyagershman/easy-poll';

function getServerPerformanceMetrics(serverId) {
    return fetch(`https://api.itmanagement.com/servers/${serverId}/performance`)
        .then(res => res.json());
}

const { subscribe, init } = subscribePolling(() => getServerPerformanceMetrics('server1'), {
    interval: 10000, // Poll every 10 seconds
});

init();

subscribe(({ event, props }) => {
    if (event === EVENTS.ON_NEXT) {
        if (props.data.cpuUsage > 90) {
            alert('High CPU usage detected!');
        }
    }
});
```

These examples demonstrate how `subscribePolling` facilitates real-time data updates and interactive user experiences in various applications, ranging from messaging and live events to system monitoring, by efficiently managing continuous data fetching and event handling.

## Licence

[MIT](./LICENCE.md)

