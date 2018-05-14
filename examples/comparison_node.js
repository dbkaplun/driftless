#!/usr/bin/env babel-node

import blessed from 'blessed'; // eslint-disable-line import/no-extraneous-dependencies
import { setDriftlessInterval } from '..';

import recorder, { avg } from './comparison_common';

const INTERVAL_MS = 1000;

const screen = blessed.screen();
screen.key(['escape', 'q', 'C-c'], (/* ch, key */) => {
  process.exit(0);
});

const comparisons = {
  setInterval: {
    start() {
      setInterval(() => {
        this.logTick();
      }, INTERVAL_MS);
    },
  },
  setDriftlessInterval: {
    start() {
      setDriftlessInterval(() => {
        this.logTick();
      }, INTERVAL_MS);
    },
  },
  'recursive setTimeout': {
    start() {
      const queueTick = () => {
        setTimeout(() => {
          queueTick();
          this.logTick();
        }, INTERVAL_MS);
      };
      queueTick();
    },
  },
};

function tickLogger(name) {
  const record = recorder();
  return () => {
    const {
      startMs,
      callCount,
      lastNCalls,
    } = record();
    if (callCount < 2) {
      // skip the first call
      return;
    }

    let lastDiff;
    const avgDiff = avg(lastNCalls.slice(1).map((callMs, i) => {
      lastDiff = (callMs - lastNCalls[i]) - INTERVAL_MS;
      return lastDiff;
    }));
    const lastMs = lastNCalls[lastNCalls.length - 1] - startMs;
    const drift = lastMs - (INTERVAL_MS * (callCount - 1));

    // console.log(name, avgDiff);

    let color = 'red';
    if (lastDiff < 5) {
      color = 'green';
    } else if (lastDiff < 10) {
      color = 'yellow';
    }

    const { title, log } = comparisons[name];
    title.setContent([
      title.getContent().replace(/(\[m)[\s\S]*$/, '$1'), // Get column name by stripping everything after underline
      `{light-gray-fg}drift{/} ${drift.toFixed(0)}ms {light-gray-fg}avg diff{/} ${Math.abs(avgDiff).toFixed(0)}ms`,
    ].join('\n'));

    log.insertTop([`{${color}-fg}{bold}${lastMs.toFixed(1)}{/bold}{/}`]);

    screen.render();
  };
}

Object.entries(comparisons).forEach(([comparison, comparisonObj], i, { length }) => {
  const obj = comparisonObj;
  const leftAmt = Math.round(100 * (i / length));
  const rightAmt = Math.round(100 * ((i + 1) / length));
  const left = `${leftAmt.toFixed(0)}%`;
  const width = `${(rightAmt - leftAmt).toFixed(0)}%`;
  obj.title = blessed.box({
    top: 0,
    height: 2,
    left,
    width,
    tags: true,
    content: `{underline}${comparison === 'setDriftlessInterval'
      ? `{bold}{blue-fg}${comparison}`
      : comparison
    }{/}`,
  });
  obj.log = blessed.box({
    top: 2,
    left,
    width,
    tags: true,
  });
  screen.append(obj.title);
  screen.append(obj.log);

  process.nextTick(() => {
    obj.start();
    obj.logTick = tickLogger(comparison);
  });
});

// screen.on('resize', () => {
//   Object.values(columns).forEach(({ log }) => {
//     log.rows = screen.rows - 1; // eslint-disable-line no-param-reassign
//   });
// });

screen.render();
