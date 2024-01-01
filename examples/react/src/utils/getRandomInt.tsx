export function getRandomInt(max: number, min: number = 1000) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
