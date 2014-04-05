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
    return Pacemaker.apply(null, [ms, repeat, fn].concat([].slice.call(arguments, 3))).start();
  },
  conflictClearHelper = function (repeat, p) {
    if (Pacemaker.isPacemaker(p)) {
      p.stop();
    } else {
      return (repeat ? Pacemaker.clearInterval : Pacemaker.clearTimeout)(p);
    }
  };

function Pacemaker (duration, repeat, tick) {
  if (!Pacemaker.isPacemaker(this)) {
    return new Pacemaker(duration, repeat, tick);
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

extend(Pacemaker, {
  isPacemaker: function (obj) { return obj instanceof Pacemaker; },

  setTimeout: global.setTimeout,
  _setTimeout: global.setTimeout.bind(null), // Callable within a function
  clearTimeout: global.clearTimeout,
  _clearTimeout: global.clearTimeout.bind(null), // Callable within a function
  setInterval: global.setInterval,
  clearInterval: global.clearInterval,

  noConflict: function () {
    global.setTimeout = Pacemaker.setTimeout;
    global.clearTimeout = Pacemaker.clearTimeout;
    global.setInterval = Pacemaker.setInterval;
    global.clearInterval = Pacemaker.clearInterval;
  },
  conflictInterval: function () {
    global.setInterval = conflictSetHelper.bind(null, true);
    global.clearInterval = conflictClearHelper.bind(null, true);
  },
  conflict: function () {
    Pacemaker.conflictInterval();
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
      opts = Pacemaker._getterSetters[name],
      type = opts.type || Pacemaker._identity;

    return typeof val === 'undefined' ? undefined : type(val === null && 'defaultVal' in opts ? opts.defaultVal : val);
  },
  _identity: function (val) { return val; }
});

extend(Pacemaker.prototype, {
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

    data.timeoutID = Pacemaker._setTimeout(this.start.bind(this), msToTick / this.aggression());

    return this;
  },

  stop: function () {
    var data = this._data;
    if ('timeoutID' in data) { Pacemaker._clearTimeout(data.timeoutID); }
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

Object.keys(Pacemaker._getterSetters).forEach(function (name) {
  Pacemaker.prototype[name] = function (val) {
    var data = this._data;
    if (!arguments.length) {
        return data[name];
    } else {
      data[name] = Pacemaker._coerce(name, val);
      return this;
    }
  };
});

module.exports = Pacemaker;
