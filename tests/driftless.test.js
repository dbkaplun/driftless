import lolex from 'lolex';

import {
  clearDriftless,
  setDriftless,
  setDriftlessInterval,
  setDriftlessTimeout,
} from '../src/driftless';

const EPSILON_MS = 1;

// Number between 0 and 1000
const randMs = () => Math.floor(Math.random() * 1000);

describe('setDriftless', () => {
  let clock;
  let clockNow;
  beforeEach(() => {
    clock = lolex.createClock();
    clockNow = () => clock.performance.now();
  });
  afterEach(() => {
    clock = null;
    clockNow = null;
  });

  it('should run the function at delayMs ± thresholdMs', async () => {
    const fn = jest.fn();
    const delayMs = randMs();
    const atMs = clockNow() + delayMs;
    const thresholdMs = 1;
    setDriftless({
      atMs,
      fn,
      thresholdMs,
      customNow: clockNow,
      customSetTimeout: clock.setTimeout,
    });

    clock.tick(delayMs - thresholdMs - EPSILON_MS);
    expect(fn).not.toBeCalled();

    clock.tick(EPSILON_MS * 2);
    expect(fn).toBeCalled();

    // clockNow() ≅ atMs ± thresholdMs
    expect(Math.abs(clockNow() - atMs)).toBeLessThanOrEqual(thresholdMs);
  });

  it('should return a new handle every time', async () => {
    const handles = new Map();
    for (let i = 0; i < 20; i += 1) {
      const fn = jest.fn();
      const atMs = clockNow() + randMs();
      const handle = setDriftless({ fn, atMs });
      expect(handles.has(handle)).toBe(false);
      handles.set(handle, true);
    }
    handles.clear();
  });
});

describe('clearDriftless', () => {
  let clock;
  let clockNow;
  beforeEach(() => {
    clock = lolex.createClock();
    clockNow = () => clock.performance.now();
  });
  afterEach(() => {
    clock = null;
    clockNow = null;
  });

  it('should stop a running timer', () => {
    const fn = jest.fn();
    const handle = setDriftless({
      fn,
      atMs: clockNow() + randMs(),
      customNow: clockNow,
      customSetTimeout: clock.setTimeout,
    });
    clearDriftless(handle, {
      customClearTimeout: clock.clearTimeout,
    });

    clock.runAll();
    expect(fn).not.toBeCalled();
  });
});

describe('setDriftlessTimeout', () => {
  let clock;
  let clockNow;
  beforeEach(() => {
    clock = lolex.install();
    clockNow = () => clock.performance.now();
  });
  afterEach(() => {
    clock.uninstall();
    clock = null;
    clockNow = null;
  });

  it('should call setDriftless internally', async () => {
    const setDriftlessSpy = jest.spyOn(setDriftless, 'setDriftlessSpyable');

    const fn = jest.fn();
    const delayMs = randMs();
    const args = ['foo', 'bar', 'baz'];
    setDriftlessTimeout(fn, delayMs, ...args);

    expect(setDriftlessSpy).toBeCalledWith(expect.objectContaining({
      atMs: clockNow() + delayMs,
    }));
    expect(fn).not.toBeCalled();

    clock.runAll();
    expect(fn).toBeCalledWith(...args);
  });

  it('should be cleared via clearDriftless', async () => {
    const fn = jest.fn();
    const handle = setDriftlessTimeout(fn, randMs());
    clearDriftless(handle);
    clock.runAll();
    expect(fn).not.toBeCalled();
  });
});

describe('setDriftlessInterval', () => {
  let clock;
  let clockNow;
  beforeEach(() => {
    clock = lolex.install();
    clockNow = () => clock.performance.now();
  });
  afterEach(() => {
    clock.uninstall();
    clock = null;
    clockNow = null;
  });

  it('should call setDriftless internally', async () => {
    const setDriftlessSpy = jest.spyOn(setDriftless, 'setDriftlessSpyable');

    const fn = jest.fn();
    const delayMs = randMs();
    const args = ['foo', 'bar', 'baz'];
    setDriftlessInterval(fn, delayMs, ...args);
    expect(setDriftlessSpy).toBeCalledWith(expect.objectContaining({
      atMs: clockNow() + delayMs,
    }));

    for (let i = 0; i < 20; i += 1) {
      expect(fn).not.toBeCalled();
      clock.tick(delayMs);
      expect(fn).toBeCalledWith(...args);
      fn.mockClear();
    }
  });

  it('should be cleared via clearDriftless', async () => {
    const fn = jest.fn();
    const delayMs = randMs();
    const handle = setDriftlessInterval(fn, delayMs);

    for (let i = 0; i < 20; i += 1) {
      expect(fn).not.toBeCalled();
      clock.tick(delayMs);
      expect(fn).toBeCalled();
      fn.mockClear();
    }

    clearDriftless(handle);
    clock.tick(delayMs * 5);
    expect(fn).not.toBeCalled();
  });
});
