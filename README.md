rolex
=========

Drift-minimizing setInterval replacement and high-precision timer utility for Node and browser

![Comparison between setInterval, rolex, and recursive setTimeout](timer-comparison.gif)

Installation
------------

In Node: `npm install rolex`

In browser:

1. Copy `rolex.js` or `rolex.min.js` (with optional source map at `rolex.min.js.map`)
2. `<script src="path/to/rolex.{min.}js"></script>`
3. `setInterval` and `clearInterval` are automatically replaced -- if this is undesired, `Rolex.noConflict();`

Usage
-----

```js
var Rolex = require('rolex')
var r = Rolex(10, () => {
  console.log('executes in 10 ms')
}).start()
```

More examples in [test/rolex.js](test/rolex.js).
