const express = require("express");
const usersRouter = require("./routes/users");
const {
  doPolling,
  subscribePolling,
  EVENTS,
} = require("@ilyagershman/easy-poll");
const app = express();
const port = 3000;

app.get("/", (req, res) => {
  res.send(
    "Hello, Polling legend! Go to the /todos route and see how it works in the console",
  );
});

app.get("/todos", async (req, res) => {
  let id = 0;
  const { data, error } = await doPolling(() => fetchTodo(id++), {
    interval: getRandomInt(6000, 500),
    until: ({ data }) => data.id >= 10,
    breakIf: (props) => {
      console.log(props);
      return false;
    },
    onStart: () => {
      console.log("onStart");
    },
    onFinish: (props) => {
      console.log(props);
      count = 0;
    },
    onNext: (props) => {
      console.log(props);
    },
    onComplete: (props) => {
      console.log(props);
    },
    onError: (props) => {
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
  });

  id = 0;
  const response = JSON.stringify({ data, error }, null, 2);
  console.log(response);
  res.send(response);
});

app.use("/users", usersRouter);

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});

// utils
const fetchTodo = (id) => {
  const url = `https://jsonplaceholder.typicode.com/todos/${id}`;

  return fetch(url).then((response) => response.json());
};

function getRandomInt(max = 4000, min = 1000) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
