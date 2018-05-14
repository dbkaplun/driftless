import now from 'present';

export const LAST_N_CALLS_LENGTH = 1000;

export default function recorder() {
  const data = {
    startMs: null,
    callCount: 0,
    lastNCalls: [],
  };
  return () => {
    const nowMs = now();
    if (data.callCount === 0) {
      data.startMs = nowMs;
    }
    data.callCount += 1;
    data.lastNCalls.push(nowMs);
    data.lastNCalls = data.lastNCalls.slice(-LAST_N_CALLS_LENGTH);
    return data;
  };
}

export function avg(xs) {
  return xs.reduce((sum, x) => (sum + x), 0) / xs.length;
}
