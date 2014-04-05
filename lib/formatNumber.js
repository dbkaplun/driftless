/*global require, module*/

var numberFormat = require('humanize').numberFormat;

function formatNumber () {
  return numberFormat.apply(this, arguments)
    .replace(/(\.|(\.(\d*[1-9])?))0+$/, '$2'); // removes trailing 0s after decimal point
}

module.exports = formatNumber;
