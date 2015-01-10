/*global require, global, module*/

var present = require('present');

var
  extend = function (obj) {
    [].slice.call(arguments, 1).forEach(function (source) {
      for (var prop in (source || {})) {
        obj[prop] = source[prop];
      }
    });
    return obj;
  },
  conflictSetHelper = function (repeat, fn, ms) {
    return Rolex.apply(null, [ms, repeat, fn].concat([].slice.call(arguments, 3))).start();
  },
  conflictClearHelper = function (repeat, p) {
    if (Rolex.isRolex(p)) {
      p.stop();
    } else {
      return (repeat ? Rolex.clearInterval : Rolex.clearTimeout)(p);
    }
  };

function Rolex (duration, repeat, tick) {
  if (!Rolex.isRolex(this)) {
    return new Rolex(duration, repeat, tick);
  }

  if (typeof tick === 'undefined') {
    tick = repeat;
    repeat = null;
  }

  var opts = {
    repeat: repeat,
    tick: tick,
    threshold: null,
    aggression: null
  };

  opts = extend(opts, isNaN(duration) ? duration : {duration: duration});

  this._data = {state: 'stopped', count: 0};

  this.tick(opts.tick);
  this.duration(opts.duration);
  this.repeat(opts.repeat);
  this.threshold(opts.threshold);
  this.aggression(opts.aggression);

  return this;
}

extend(Rolex, {
  isRolex: function (obj) { return obj instanceof Rolex; },

  setTimeout: global.setTimeout,
  _setTimeout: global.setTimeout.bind(null), // Callable within a function
  clearTimeout: global.clearTimeout,
  _clearTimeout: global.clearTimeout.bind(null), // Callable within a function
  setInterval: global.setInterval,
  clearInterval: global.clearInterval,

  noConflict: function () {
    global.setTimeout = Rolex.setTimeout;
    global.clearTimeout = Rolex.clearTimeout;
    global.setInterval = Rolex.setInterval;
    global.clearInterval = Rolex.clearInterval;
  },
  conflictInterval: function () {
    global.setInterval = conflictSetHelper.bind(null, true);
    global.clearInterval = conflictClearHelper.bind(null, true);
  },
  conflict: function () {
    Rolex.conflictInterval();
    global.setTimeout = conflictSetHelper.bind(null, false);
    global.clearTimeout = conflictClearHelper.bind(null, false);
  },

  _getterSetters: {
    tick: {type: function (tick) { return (tick && typeof tick.call === 'function') ? tick : new Function(tick); }}, // jshint ignore:line
    duration: {type: Number},
    repeat: {type: null, defaultVal: 1},
    threshold: {type: Number, defaultVal: 1},
    aggression: {type: Number, defaultVal: 1.1}
  },
  _coerce: function (name, val) {
    var
      opts = Rolex._getterSetters[name],
      type = opts.type || Rolex._identity;

    return typeof val === 'undefined' ? undefined : type(val === null && 'defaultVal' in opts ? opts.defaultVal : val);
  },
  _identity: function (val) { return val; }
});

extend(Rolex.prototype, {
  start: function () {
    var
      data = this._data,
      now = present(),
      msToTick;

    if (this.state() !== 'started') {
      data.state = 'started';
      data.count = 0;
      data.startTime = now;
    }

    msToTick = this.tickTime() - now;
    if (msToTick !== msToTick) { throw TypeError("msToTick is NaN"); }

    if (msToTick <= this.threshold()) {
      data.count++;
      this.tick().call(this);
      if (this.state() === 'stopped' || this.isLastTick()) { return this.stop(); }
    }

    data.timeoutID = Rolex._setTimeout(this.start.bind(this), msToTick / this.aggression());

    return this;
  },

  stop: function () {
    var data = this._data;
    if ('timeoutID' in data) { Rolex._clearTimeout(data.timeoutID); }
    data.state = 'stopped';

    return this;
  },

  tickTime: function (n) {
    if (this.state() === 'started') {
      return this.startTime() + this.duration() * (this.count() + (typeof n !== 'undefined' ? n : 1));
    }
  },

  isLastTick: function () { return this.repeat() !== true && this.count() >= this.repeat(); },

  runTime: function () { return this.state() === 'started' ? present() - this.startTime() : 0; },

  count: function () { return this._data.count; },

  state: function () { return this._data.state; },

  startTime: function () { return this._data.startTime; }
});

Object.keys(Rolex._getterSetters).forEach(function (name) {
  Rolex.prototype[name] = function (val) {
    var data = this._data;
    if (!arguments.length) {
        return data[name];
    } else {
      data[name] = Rolex._coerce(name, val);
      return this;
    }
  };
});

Rolex.conflictInterval();

module.exports = Rolex;
