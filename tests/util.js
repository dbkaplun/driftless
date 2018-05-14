export const EPSILON_MS = 1;

export function yieldToTimers() {
  return new Promise((resolve) => {
    setImmediate(resolve);
  });
}
