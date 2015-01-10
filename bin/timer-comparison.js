#!/usr/bin/env node

var rolex = require('../lib/rolex');
var timerComparison = require('../lib/timerComparison');
var formatNumber = require('../lib/formatNumber');
var stats = require('../lib/stats');

var blessed = require('blessed');

var screen = blessed.screen();

var setIntervalTitle = blessed.box({
  top: 0,
  left: '0%',
  width: '33%',
  height: 1,

  tags: true,
  content: "{underline}setInterval{/}"
});
screen.append(setIntervalTitle);
var setIntervalLog = blessed.box({
  top: 1,
  left: '0%',
  width: '33%',
  tags: true
});
screen.append(setIntervalLog);

var rolexTitle = blessed.box({
  top: 0,
  left: '33%',
  width: '34%',
  height: 1,

  tags: true,
  content: "{underline}rolex{/}"
});
screen.append(rolexTitle);
var rolexLog = blessed.box({
  top: 1,
  left: '33%',
  width: '34%',
  tags: true
});
screen.append(rolexLog);

var recursiveSetTimeoutTitle = blessed.box({
  top: 0,
  left: '67%',
  width: '33%',
  height: 1,

  tags: true,
  content: "{underline}Recursive setTimeout{/}"
});
screen.append(recursiveSetTimeoutTitle);
var recursiveSetTimeoutLog = blessed.box({
  top: 1,
  left: '67%',
  width: '33%',
  tags: true
});
screen.append(recursiveSetTimeoutLog);

screen.key(['escape', 'q', 'C-c'], function (ch, key) { return process.exit(0); });
screen.on('resize', function () {
  setIntervalLog.rows = screen.rows - 1;
  rolexLog.rows = screen.rows - 1;
  recursiveSetTimeoutLog.rows = screen.rows - 1;
});

screen.render();

var ms = 1000;
function logToBox (box, title) {
  var diffs = [];
  return function (line) {
    var diffAbs = Math.abs(line.diff);
    var color = 'red';
         if (diffAbs <= 1) { color = 'green'; }
    else if (diffAbs <= 5) { color = 'yellow'; }

    diffs.push(line.diff);
    title.setContent(title.getContent()
      .replace(/(\[m).*$/, '$1') + // Strips everything after underline-ending markup
      ' avg diff:' + formatNumber(stats.mean(diffs)));

    box.insertTop(['{'+color+'-fg}' +
      '{bold}' + formatNumber(line.runTime, 0) + '{/bold}' +
      ' drift:' + formatNumber(line.drift, 0) +
      ' diff:' + formatNumber(line.diff, 0) +
    '{/}']);
    screen.render();
  };
}

timerComparison(ms, function (name) {
  return {
    setInterval: logToBox(setIntervalLog, setIntervalTitle),
    rolex: logToBox(rolexLog, rolexTitle),
    recursiveSetTimeout: logToBox(recursiveSetTimeoutLog, recursiveSetTimeoutTitle)
  }[name];
});
