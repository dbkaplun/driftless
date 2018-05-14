# `driftless` [![Build Status](https://travis-ci.com/dbkaplun/driftless.svg?branch=master)](https://travis-ci.com/dbkaplun/driftless)

Driftless setInterval and setTimeout replacement for Node and the browser

![comparison](timer-comparison.gif)

## How it works

`driftless` repeatedly calls setTimeout in advance of the requested timeout for
greater accuracy. It does this recursively, until the timeout is reached within
a given threshold.

## Usage

```
npm install driftless
```

```js
import {
  setDriftlessTimeout,
  setDriftlessInterval,
  clearDriftless,
} from 'driftless';
// Use like setTimeout and setInterval
```
