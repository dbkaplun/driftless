/*global require, setInterval, setTimeout, module*/

var Rolex = require('./rolex');
var present = require('present');

function timerComparison (ms, render) {
  setInterval(timerComparison.log(ms, render('setInterval')), ms);
  Rolex(ms, true, timerComparison.log(ms, render('rolex'))).start();
  (function recursiveSetTimeout (fn) {
    setTimeout(function () {
      fn();
      recursiveSetTimeout(fn);
    }, ms);
  }(timerComparison.log(ms, render('recursiveSetTimeout'))));
}
timerComparison.log = function (ms, render) {
  var start = present();
  var count = 0;
  var lastRunTime = 0;
  return function () {
    var runTime = present() - start;
    render({
      runTime: runTime,
      drift: runTime - (ms * ++count),
      diff: runTime - lastRunTime - ms
    });
    lastRunTime = runTime;
  };
};

module.exports = timerComparison;
