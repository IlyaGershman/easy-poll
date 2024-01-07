const express = require('express');
const usersRouter = require('./routes/users');
const { doPolling, subscribePolling, EVENTS } = require('../../');
const app = express();
const port = 3000;

app.get('/', (req, res) => {
  res.send('Hello, Polling legend! Go to the /todos route and see how it works in the console');
});

app.get('/todos', async (req, res) => {
  let id = 0;
  const { data, error } = doPolling(() => fetchTodo(id), {
    interval: getRandomInt(6000, 500),
    until: ({ data }) => data.id >= 10,
    breakIf: props => {
      console.log(props);
      return false;
    },
    onStart: () => {
      console.log('onStart');
    },
    onFinish: props => {
      console.log(`onFinish`, JSON.stringify(props, null, 2));
      count = 0;
    },
    onNext: props => {
      console.log(`onNext`, JSON.stringify(props, null, 2));
    },
    onComplete: props => {
      console.log(`onComplete`, JSON.stringify(props, null, 2));
    },
    onError: props => {
      console.log(`onError`, JSON.stringify(props, null, 2));
    },
    onBreak(props) {
      console.log(`onBreak`, JSON.stringify(props, null, 2));
    },
    onIntervalError(props) {
      console.log(`onIntervalError`, JSON.stringify(props, null, 2));
    },
    onTooManyAttempts(props) {
      console.log(`onTooManyAttempts`, JSON.stringify(props, null, 2));
    },
    onTooManyErrors(props) {
      console.log(`onTooManyErrors`, JSON.stringify(props, null, 2));
    },
  }).init();

  const response = JSON.stringify({ data, error }, null, 2);
  console.log(response);
  res.send(response);
});

app.get('/todosWithAbort', async (req, res) => {
  let id = 0;
  const { init, abort } = doPolling(() => fetchTodo(id++), {
    interval: getRandomInt(6000, 500),
    until: ({ data }) => data.id >= 10,
    breakIf: props => {
      console.log(props);
      return false;
    },
    onStart: () => {
      console.log('onStart');
    },
    onFinish: props => {
      console.log(`onFinish`, JSON.stringify(props, null, 2));
      count = 0;
    },
    onNext: props => {
      console.log(`onNext`, JSON.stringify(props, null, 2));
    },
    onComplete: props => {
      console.log(`onComplete`, JSON.stringify(props, null, 2));
    },
    onError: props => {
      console.log(`onError`, JSON.stringify(props, null, 2));
    },
    onBreak(props) {
      console.log(`onBreak`, JSON.stringify(props, null, 2));
    },
    onIntervalError(props) {
      console.log(`onIntervalError`, JSON.stringify(props, null, 2));
    },
    onTooManyAttempts(props) {
      console.log(`onTooManyAttempts`, JSON.stringify(props, null, 2));
    },
    onTooManyErrors(props) {
      console.log(`onTooManyErrors`, JSON.stringify(props, null, 2));
    },
  });

  setTimeout(() => {
    try {
      abort();
    } catch (error) {
      console.log(`error`, error);
    }
  }, 3000);

  const resolvedPoll = await init();
  const response = JSON.stringify(resolvedPoll, null, 2);
  console.log(`response`, response);
  res.send(response);
});

app.use('/users', usersRouter);

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});

// utils
const fetchTodo = id => {
  const url = `https://jsonplaceholder.typicode.com/todos/${id}`;

  return fetch(url).then(response => response.json());
};

function getRandomInt(max = 4000, min = 1000) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
