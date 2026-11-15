export function unreachable(value: never): never {
  throw new Error(`unreachable value ${JSON.stringify(value)}`);
}
