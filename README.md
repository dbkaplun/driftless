# rolex [![rolex on npm](https://img.shields.io/npm/dm/rolex.svg?maxAge=2592000)](https://www.npmjs.com/package/rolex) [![build status](https://img.shields.io/travis/dbkaplun/rolex.svg?maxAge=2592000)](https://travis-ci.org/dbkaplun/rolex)

Drift-minimizing setInterval replacement and high-precision timer utility for Node and browser

![Comparison between setInterval, rolex, and recursive setTimeout](timer-comparison.gif)

## How it works

To ensure maximal accuracy compared with setTimeout, Rolex calls setTimeout *in advance* of the requested timeout, then checks how close the requested timeout
is. It does this recursively until the timeout is reached within a given
threshold. Both the `aggression` and `threshold` are user-configurable.

## Installation

In Node: `npm install rolex`

In browser:

1. Copy `rolex.js` or `rolex.min.js` (with optional source map at `rolex.min.js.map`)
2. `<script src="path/to/rolex.{min.}js"></script>`
3. `setInterval` and `clearInterval` are automatically replaced -- if this is undesired, `Rolex.noConflict();`

## Usage

```js
var Rolex = require('rolex')
var r = Rolex(10, () => {
  console.log('executes in 10 ms')
}).start()
```

More examples in [test/rolex.js](test/rolex.js).
