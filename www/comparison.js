/*global require*/

var jQuery = require('jquery');

var timerComparison = require('../lib/timerComparison');
var formatNumber = require('../lib/formatNumber');
var stats = require('../lib/stats');

var maxRows = 1000;
var ms = 1000;
var logToContainer = function ($container) {
  var diffs = [];
  var $avgDiff = $container.find('.avg-diff');
  var $tbody = $container.find('tbody');
  return function (row) {
    var $row = $('<tr>')
      .append($('<td>', {'class': 'run-time'}).text(formatNumber(row.runTime)))
      .append($('<td>', {'class': 'drift'}).text(formatNumber(row.drift)))
      .append($('<td>', {'class': 'diff'}).text(formatNumber(row.diff)))
      .prependTo($tbody);

    var diffAbs = Math.abs(row.diff);
    if      (diffAbs <= 1) { $row.addClass('success'); }
    else if (diffAbs <= 5) { $row.addClass('warning'); }
    else                    { $row.addClass('danger'); }

    $tbody.find('tr').slice(maxRows).remove();

    diffs.unshift(row.diff);
    diffs = diffs.slice(0, maxRows);
    $avgDiff.text(formatNumber(stats.mean(diffs)));

    var scrollTop = $container.scrollTop();
    if (scrollTop !== 0) {
      $container.scrollTop(scrollTop + $row.height());
    }
  };
};

jQuery(function ($) {
  var $logTemplate = $('#log-template').contents();
  var $setIntervalContainer = $('#setInterval-comparison .log-container')
    .append($logTemplate.clone());
  var $rolexContainer = $('#rolex-comparison .log-container')
    .append($logTemplate.clone());
  var $recursiveSetTimeoutContainer = $('#recursiveSetTimeout-comparison .log-container')
    .append($logTemplate.clone());
  timerComparison(ms, function (name) {
    return {
      setInterval: logToContainer($setIntervalContainer),
      rolex: logToContainer($rolexContainer),
      recursiveSetTimeout: logToContainer($recursiveSetTimeoutContainer)
    }[name];
  });
});
