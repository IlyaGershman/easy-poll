let id = 0;

export const getPollId = () => {
  return `poll_${id++}`;
};
