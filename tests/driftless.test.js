import {
  // clearDriftless,
  setDriftless,
  // setDriftlessInterval,
  // setDriftlessTimeout,
} from '../src/driftless';

import { EPSILON_MS, yieldToTimers } from './util';

let mockNowMs = Date.now();
const mockNow = jest.fn(() => mockNowMs);
jest.useFakeTimers();

async function fastForward(ms) {
  jest.advanceTimersByTime(ms);
  mockNowMs += ms;
  await yieldToTimers();
}

describe('setDriftless', () => {
  it('should run within delayMs ± thresholdMs', async () => {
    const fn = jest.fn();
    const delayMs = 45;
    const atMs = mockNow() + delayMs;
    const thresholdMs = 1;
    setDriftless({
      atMs,
      fn,
      thresholdMs,
      customNow: mockNow,
    });

    await fastForward(delayMs - thresholdMs - EPSILON_MS);
    expect(fn).not.toBeCalled();

    await fastForward(EPSILON_MS * 2);
    expect(fn).toBeCalled();
  });
});
describe('clearDriftless', () => {
  it('should stop a running timer', () => {
    expect(false).toBeTruthy();
  });
});
