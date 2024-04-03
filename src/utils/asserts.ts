export function assertNumber(value: any): asserts value is number {
  if (typeof value !== 'number') {
    throw new Error('value must be a number');
  }
}
