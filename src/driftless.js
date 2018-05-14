import present from 'present';

export const DEFAULT_THRESHOLD_MS = 1;
export const DEFAULT_AGGRESSION = 1.1;
export const DEFAULT_NOW_FN = present;
export const DEFAULT_SET_TIMEOUT = setTimeout;

const ids = {};
let nextId = 0;

function tryDriftless(id, opts) {
  const {
    atMs,
    fn,
    thresholdMs = DEFAULT_THRESHOLD_MS,
    aggression = DEFAULT_AGGRESSION,
    customNow = DEFAULT_NOW_FN,
    customSetTimeout = DEFAULT_SET_TIMEOUT,
  } = opts;
  const delayMs = atMs - customNow();

  if (delayMs <= thresholdMs) {
    setImmediate(fn);
    return;
  }

  const handle = customSetTimeout(() => {
    tryDriftless.apply(this, arguments); // eslint-disable-line prefer-rest-params
  }, delayMs / aggression);
  ids[id] = handle;
}

export function setDriftless(opts) {
  const id = nextId;
  nextId += 1;
  tryDriftless(id, opts);
  return id;
}

export function clearDriftless(id) {
  clearTimeout(ids[id]);
}

function castToFn(fn) {
  return typeof fn === 'function'
    ? fn
    : new Function(fn); // eslint-disable-line no-new-func
}

export function setDriftlessTimeout(fn, delayMs, ...params) {
  const callFn = castToFn(fn);
  return setDriftless({
    atMs: DEFAULT_NOW_FN() + delayMs,
    fn(...args) {
      return callFn.call(this, ...args, ...params);
    },
  });
}

export function setDriftlessInterval(fn, delayMs, ...params) {
  const callFn = castToFn(fn);
  const opts = {
    atMs: DEFAULT_NOW_FN() + delayMs,
    fn(...args) {
      opts.atMs += delayMs;
      tryDriftless(opts);
      return callFn.call(this, ...args, ...params);
    },
  };
  return setDriftless(opts);
}
