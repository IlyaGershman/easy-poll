export function assertNumber(value: any): asserts value is number {
  if (typeof value !== 'number') {
    throw new Error('value must be a number');
  }
}

export function assertIsPositiveNumber(value: unknown): asserts value is number {
  assertNumber(value);

  if (value < 0) {
    throw new Error('value must be greater than or equal to 0');
  }
}
