//#!/usr/bin/env node
/*global require, global*/

var _setTimeout = global.setTimeout;
var _clearTimeout = global.clearTimeout;
var _setInterval = global.setInterval;
var _clearInterval = global.clearInterval;

var test = require('tape');
var present = require('present');
var Rolex = require('../lib/rolex');

var mockDuration = 5;
var mockRepeat = 8;
var mockThreshold = 2;
var mockAggression = 2;

function assertWithin (t, val, expected, range) {
  t.ok(val >= expected - range, "val >= expected - range");
  t.ok(val <= expected + range, "val <= expected + range");
}

function assertRolexReturnsValues (t, p, expected) {
  ['duration', 'tick', 'repeat', 'threshold', 'aggression'].forEach(function (name) {
    var val = (expected || {})[name] || (Rolex._getterSetters[name] || {}).defaultVal;
    t.equal(p[name](), val, "p." + name + "() equals " + val);
  });
}

function testGetterSetterCoersion (name, t) {
  t.test("should coerce arg", function (st) {
    var p = Rolex();

    [null, undefined, 0, '', false, [], new Date(), new Error(), new RegExp(), function () {}].forEach(function (value) {
      try { p[name](value); } catch (e) { return; }

      var
        typedValue = Rolex._coerce(name, value),
        result = p[name]();

      if (typedValue === typedValue) { // !isNaN(typedValue)
        if (typeof typedValue !== 'function' || typedValue === result) {
          st.equal(result, typedValue, "p." + name + "() returned coerced value"); // accommodates for result = undefined
        }
      } else {
        st.notEqual(result, result, "p." + name + "() returned coerced value of NaN");
      }
    });
    st.end();
  });
}

test("Rolex", function (t) {
  t.test(".isRolex", function (st) {
    st.test("should return whether the argument is a Rolex", function (sst) {
      sst.plan(3);

      sst.equal(Rolex.isRolex(1), false, "1 is not a Rolex");
      sst.equal(Rolex.isRolex({}), false, "{} is not a Rolex");
      sst.equal(Rolex.isRolex(Rolex()), true, "Rolex() returned a Rolex");
    });
  });
  t.test(".setTimeout", function (st) {
    st.test("should equal setTimeout", function (sst) {
      sst.plan(1);

      sst.equal(Rolex.setTimeout, _setTimeout, "Rolex.setTimeout equaled original setTimeout");
    });
  });
  t.test(".clearTimeout", function (st) {
    st.test("should equal clearTimeout", function (sst) {
      sst.plan(1);

      sst.equal(Rolex.clearTimeout, _clearTimeout, "Rolex.clearTimeout equaled original clearTimeout");
    });
  });
  t.test(".setInterval", function (st) {
    st.test("should equal setInterval", function (sst) {
      sst.plan(1);

      sst.equal(Rolex.setInterval, _setInterval, "Rolex.setInterval equaled original setInterval");
    });
  });
  t.test(".clearTimeout", function (st) {
    st.test("should equal clearInterval", function (sst) {
      sst.plan(1);

      sst.equal(Rolex.clearInterval, _clearInterval, "Rolex.clearInterval equaled original clearInterval");
    });
  });
  t.test(".noConflict", function (st) {
    st.test("should reset setTimeout, clearTimeout, setInterval, and clearInterval", function (sst) {
      sst.plan(4);

      global.setTimeout = mockDuration;
      global.clearTimeout = mockDuration;
      global.setInterval = mockDuration;
      global.clearInterval = mockDuration;

      Rolex.noConflict();

      sst.equal(global.setTimeout, _setTimeout, "clearInterval reset to original value");
      sst.equal(global.clearTimeout, _clearTimeout, "clearTimeout reset to original value");
      sst.equal(global.setInterval, _setInterval, "setInterval reset to original value");
      sst.equal(global.clearInterval, _clearInterval, "clearInterval reset to original value");
    });
  });
  t.test(".conflictInterval", function (st) {
    var conflictIntervalTest = function (sst) {
      Rolex.conflictInterval();
      sst.on('end', function () { Rolex.noConflict(); });
    };

    st.test("should replace setInterval and clearInterval", function (sst) {
      conflictIntervalTest(sst);
      sst.plan(5);

      sst.notEqual(global.setInterval, _setInterval, "setInterval changed from original value");
      sst.notEqual(global.clearInterval, _clearInterval, "clearInterval changed from original value");

      var interval = global.setInterval(Rolex._identity, mockDuration);

      sst.ok(Rolex.isRolex(interval), "overridden setInterval() returned a Rolex");
      sst.equal(interval.state(), 'started', "overridden setInterval() returned a started Rolex");

      global.clearInterval(interval);
      sst.equal(interval.state(), 'stopped', "overridden clearInterval() stopped given Rolex");
    });

    st.test("should still work with intervalIds", function (sst) {
      conflictIntervalTest(sst);
      sst.plan(1);

      var called = false;

      global.clearInterval(_setInterval(function () {
        called = true;
      }, mockDuration));
      Rolex(mockDuration * 2, function () {
        sst.notOk(called, "overridden clearInterval() cleared original setInterval");
      }).start();
    });
  });
  t.test(".conflict", function (st) {
    var conflictIntervalCalled = false;
    var _conflictInterval = Rolex.conflictInterval;
    Rolex.conflictInterval = function () {
      conflictIntervalCalled = true;
      return _conflictInterval.apply(this, arguments);
    };
    st.on('end', function () {
      Rolex.conflictInterval = _conflictInterval;
    });

    var conflictTest = function (t) {
      Rolex.conflict();
      t.on('end', function () { Rolex.noConflict(); });
    };

    st.test("should call Rolex.conflictInterval", function (sst) {
      conflictTest(sst);
      sst.plan(1);

      sst.ok(conflictIntervalCalled, "Rolex.conflict called Rolex.conflictInterval");
    });
    st.test("should replace setTimeout and clearTimeout", function (sst) {
      conflictTest(sst);
      sst.plan(5);

      sst.notEqual(global.setTimeout, _setTimeout, "setTimeout changed from original value");
      sst.notEqual(global.clearTimeout, _clearTimeout, "clearTimeout changed from original value");

      var timeout = global.setTimeout(Rolex._identity, mockDuration);

      sst.ok(Rolex.isRolex(timeout), "overridden setTimeout() returned a Rolex");
      sst.equal(timeout.state(), 'started', "overridden setTimeout() returned a started Rolex");

      global.clearTimeout(timeout);
      sst.equal(timeout.state(), 'stopped', "overridden setTimeout() stopped given Rolex");
    });
    st.test("should still work with timeoutIds", function (sst) {
      conflictTest(sst);
      sst.plan(1);

      var called = false;

      global.clearTimeout(_setTimeout(function () {
        called = true;
      }, mockDuration));
      Rolex(mockDuration * 2, function () {
        sst.notOk(called, "overridden clearTimeout() cleared original setTimeout");
      }).start();
    });
  });

  t.test("#constructor", function (st) {
    st.test("should instantiate with default values when passed no arguments", function (sst) {
      sst.plan(5);

      var p = Rolex();

      assertRolexReturnsValues(sst, p);
    });

    st.test("should instantiate with default values when passed {}", function (sst) {
      sst.plan(5);

      var p = Rolex({});

      assertRolexReturnsValues(sst, p);
    });

    st.test("should instantiate when passed duration", function (sst) {
      sst.plan(5);

      var p = Rolex(mockDuration);

      assertRolexReturnsValues(sst, p, {duration: mockDuration});
    });

    st.test("should instantiate when passed duration, tick", function (sst) {
      sst.plan(5);

      var p = Rolex(mockDuration, Rolex._identity);

      assertRolexReturnsValues(sst, p, {
        duration: mockDuration,
        tick: Rolex._identity
      });
    });

    st.test("should instantiate when passed duration, repeatInt, tick", function (sst) {
      sst.plan(5);

      var p = Rolex(mockDuration, mockRepeat, Rolex._identity);

      assertRolexReturnsValues(sst, p, {
        duration: mockDuration,
        tick: Rolex._identity,
        repeat: mockRepeat
      });
    });

    st.test("should instantiate when passed duration, true, tick", function (sst) {
      sst.plan(5);

      var p = Rolex(mockDuration, true, Rolex._identity);

      assertRolexReturnsValues(sst, p, {
        duration: mockDuration,
        tick: Rolex._identity,
        repeat: true
      });
    });

    st.test("should instantiate when passed {duration: ..., repeat: ..., tick: ..., threshold: ..., aggression: ...}", function (sst) {
      sst.plan(5);

      var opts = {
        duration: mockDuration,
        tick: Rolex._identity,
        repeat: mockRepeat,
        threshold: mockThreshold,
        aggression: mockAggression
      };

      var p = Rolex(opts);

      assertRolexReturnsValues(sst, p, opts);
    });
    st.test("should work with the 'new' keyword", function (sst) {
      sst.plan(5);

      var p = new Rolex(mockDuration, mockRepeat, Rolex._identity);

      assertRolexReturnsValues(sst, p, {
        duration: mockDuration,
        tick: Rolex._identity,
        repeat: mockRepeat
      });
    });
  });
  t.test("#start", function (st) {
    st.test("should throw TypeError if duration is unspecified", function (sst) {
      sst.plan(1);

      var p = Rolex();
      sst.throws(p.start.bind(p), TypeError, "msToTick is NaN");
    });

    st.test("should return a Rolex", function (sst) {
      sst.plan(2);

      var p = Rolex(mockDuration).start();
      sst.ok(Rolex.isRolex(p), "p.start() returned a Rolex");
      sst.equal(p.state(), 'started', "p.start() returned a started Rolex");
      p.stop();
    });

    st.test("should eventually throw TypeError if tick is unspecified", function (sst) {
      var
        p = Rolex(mockDuration),
        start = p.start;

      (p.start = function () {
        try {
          start.apply(this, arguments);
        } catch (e) {
          sst.ok(e instanceof TypeError, "p.start() eventually threw a TypeError because no tick was specified");
          sst.equal(e.message, "Cannot read property 'call' of undefined");
          sst.end();
        }
      }).call(p);
    });

    st.test("should be called at most log_aggression(duration) times before a tick", function (sst) {
      sst.plan(1);

      // TODO: strengthen this condition if possible
      var
        count = 0,
        p = Rolex(mockDuration, function () {
          sst.ok(count < Math.log(this.duration())/Math.log(this.aggression()) + 1, "p.start() was called no more than log_aggression(duration) times before a tick");
        }),
        start = p.start;

      (p.start = function () {
        count++;
        start.apply(this, arguments);
      }).call(p);
    });

    st.skip("should call tick within duration +/- threshold", function (sst) {
      sst.plan(mockRepeat * 2);

      Rolex(mockDuration, mockRepeat, function () {
        assertWithin(sst, this.tickTime(0), present(), this.threshold());
      }).start();
    });

    st.test("should call tick repeat times if repeat is an integer", function (sst) {
      sst.plan(1);

      var p = Rolex(mockDuration, mockRepeat, function () {
        if (this.isLastTick()) {
          sst.equal(this.count(), this.repeat(), "p.start() was called " + this.count() + " times");
        }
      }).start();
    });

    st.test("should call tick with rolex instance as this", function (sst) {
      sst.plan(1);

      var p = Rolex(mockDuration, 1, function () {
        sst.equal(this, p, "p.tick() called with p as this");
      }).start();
    });
  });
  t.test("#stop", function (st) {
    st.test("should return a Rolex", function (sst) {
      sst.plan(1);

      sst.ok(Rolex.isRolex(Rolex().stop()), "p.stop() returned a Rolex");
    });

    st.test("should stop a started Rolex", function (sst) {
      sst.plan(2);

      var p = Rolex(mockDuration, true, function () {
        sst.equal(this.state(), 'started', "p.state() returned 'started' within tick");
        this.stop();
        sst.equal(this.state(), 'stopped', "p.stop() changed state from 'started' to 'stopped'");
      }).start();
    });

    st.test("should do nothing if not started", function (sst) {
      sst.plan(3);

      var p = Rolex();
      sst.equal(p.state(), 'stopped', "newly-created p.state() returned 'stopped'");
      sst.doesNotThrow(p.stop.bind(p), "p.stop() didn't throw an exception");
      sst.equal(p.state(), 'stopped', "p.stop() didn't change p's state");
    });
  });

  // Getter/setters
  t.test("#tick", function (st) {
    testGetterSetterCoersion('tick', st);
    st.test("should not coerce if arg.call is a function", function (sst) {
      sst.plan(3);

      var p = Rolex();

      sst.throws(p.tick.bind(p, {}), SyntaxError, "Unexpected identifier");
      sst.throws(p.tick.bind(p, {call: ''}), SyntaxError, "Unexpected identifier");
      sst.notOk(p.tick({call: function () {}}).tick() instanceof Function, "p.tick(val) didn't coerce val to a function if val.call is a function");
    });
  });
  t.test("#duration", testGetterSetterCoersion.bind(null, 'duration'));
  t.test("#repeat", testGetterSetterCoersion.bind(null, 'repeat'));
  t.test("#threshold", testGetterSetterCoersion.bind(null, 'threshold'));
  t.test("#aggression", testGetterSetterCoersion.bind(null, 'aggression'));

  // Getters
  t.test("#tickTime", function (st) {
    st.test("should return undefined when Rolex is not started", function (sst) {
      sst.plan(5);

      var p = Rolex(mockDuration, mockRepeat, Rolex._identity);

      sst.equal(p.tickTime(), undefined, "newly-created p.tickTime() returned undefined");
      sst.equal(p.tickTime(-1), undefined, "newly-created p.tickTime(-1) returned undefined");
      sst.equal(p.tickTime(0), undefined, "newly-created p.tickTime(0) returned undefined");
      sst.equal(p.tickTime(1), undefined, "newly-created p.tickTime(1) returned undefined");
      sst.equal(p.tickTime(2), undefined, "newly-created p.tickTime(2) returned undefined");
    });
    st.test("should return time n ticks from start time", function (sst) {
      var ns = [-1, 0, 1, 2];
      sst.plan(mockRepeat * ns.length);

      var p = Rolex(mockDuration, mockRepeat, function () {
        ns.forEach(function (n) {
          sst.equal(p.tickTime(n), p.startTime() + p.duration() * (p.count() + n), "p.tickTime(" + n + ") returned time " + n + " ticks from start time");
        });
      }).start();
    });
    st.test("should return time next tick will be called when passed no arguments", function (sst) {
      sst.plan(mockRepeat);

      Rolex(mockDuration, mockRepeat, function () {
        sst.equal(this.tickTime(), this.tickTime(1), "p.tickTime() returned time next tick will be called");
      }).start();
    });
  });

  t.test("#isLastTick", function (st) {
    st.test("should return whether the current tick is the last tick from within a tick", function (sst) {
      sst.plan(mockRepeat);

      Rolex(mockDuration, mockRepeat, function () {
        sst.equal(this.isLastTick(), this.count() === this.repeat(), "p.isLastTick() returned whether the current tick is the last tick from within a tick");
      }).start();
    });
  });

  t.test("#runTime", function (st) {
    st.test("should return now - startTime", function (sst) {
      sst.plan((mockRepeat * 2) + 1);

      var p = Rolex(mockDuration, mockRepeat, function () {
        assertWithin(sst, this.runTime(), present() - this.startTime(), 1);
      });
      sst.equal(p.runTime(), 0, "newly-created p.runTime() returned 0");
      p.start();
    });
  });

  t.test("#count", function (st) {
    st.test("should return number of times tick called", function (sst) {
      sst.plan(mockRepeat + 1);

      var count = 0;
      var p = Rolex(mockDuration, mockRepeat, function () {
        sst.equal(this.count(), ++count, "p.count() incremented after a tick");
      });
      sst.equal(p.count(), 0, "newly-created p.count() returned 0");
      p.start();
    });
    st.skip("should return floor(runTime/duration + 0.5)", function (sst) {
      sst.plan(mockRepeat);

      Rolex(mockDuration, mockRepeat, function () {
        sst.equal(this.count(), Math.floor(this.runTime()/this.duration() + 0.5), "p.count() returned floor(runTime/duration + 0.5)");
      }).start();
    });
  });

  t.test("#state", function (st) {
    st.test("should return 'stopped' before Rolex is started", function (sst) {
      sst.plan(1);

      sst.equal(Rolex().state(), 'stopped', "newly-created p.state() returned 'stopped'");
    });
    st.test("should return 'started' after Rolex is started", function (sst) {
      sst.plan(1);

      sst.equal(Rolex(mockDuration, Rolex._identity).start().state(), 'started', "p.state() returned 'started' after p.start()");
    });
    st.test("should return 'stopped' after Rolex is stopped", function (sst) {
      sst.plan(2);

      Rolex(mockDuration, true, function () {
        sst.equal(this.state(), 'started', "p.state() returned 'started' within tick");
        this.stop();
        sst.equal(this.state(), 'stopped', "p.state() changed state from 'started' to 'stopped'");
      }).start();
    });
  });

  t.test("#startTime", function (st) {
    st.test("should return undefined if Rolex is not started", function (sst) {
      sst.plan(1);

      sst.equal(Rolex().startTime(), undefined, "newly-created p.startTime() returned undefined");
    });
    st.test("should return time when Rolex was started", function (sst) {
      sst.plan(2 * (mockRepeat + 1));

      var now = present();
      var p = Rolex(mockDuration, mockRepeat, function () {
        assertWithin(sst, this.startTime(), now, 1);
      }).start();
      assertWithin(sst, p.startTime(), now, 1);
    });
  });
});
