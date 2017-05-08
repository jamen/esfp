
# ES Functional Programming

> Making functional programming in JavaScript better

This project is a [Browserify transform](https://www.npmjs.com/package/browserify) that has several features (some non-standard) for doing functional programming in JavaScript better.  The repo also serves as a place to discuss moving JavaScript in a more functional direction, and how we can add them here.

## Features

 - The good ES6+ features (inspired from [`es2020`](https://npmjs.com/es2020) and [`es2040`](https://npmjs.com/es2040))
   - Template literals
   - Arrow functions
   - Block scoping
   - Destructuring
   - Default params
   - Rest/spread
   - Shorthand properties (e.g. `{ foo, bar }`)
   - Object rest/spreads (e.g. `{ ...foo, bar: 123 }`)
 - Non-standard features
   - [Pipe operator over](https://npmjs.com/babel-plugin-pull) [`pull-stream`](https://github.com/pull-stream/pull-stream)
   - [Implicit return value](https://npmjs.com/babel-plugin-implicit-return)
   - React JSX with `pragma: 'h'` out-of-the-box

Here is an example of piping, with implicit return, and cloning an object using spread:

```js
function foo (options) {
  options = { bar: 123, ...options }

  foobar(options)
  | bazqux()
  | oofrab()
}
```

## Install

```sh
npm install --save esfp

# with yarn
yarn add esfp
```

## Usage

Load as a browserify transform in whatever tool you use.  For example, with CLI:

```js
browserify entry.js -g esfp > out.js
```

Or with `browserify`

```js
b.transform('esfp')
```

Or [`pull-bundle`](https://npmjs.com/pull-bundle) (for a more functional solution :wink:)

```js
bundle('app.js', [ 'esfp' ])
```

### Pipe operator

To use the pipe operator, you should first be familiar with [`pull-stream`](https://github.com/pull-stream/pull-stream), as it will let you do cool things like async and partial pipelines.

Here we just transform `foo | bar | ...` chains into `pull(foo, bar, ...)` calls:

```js
values([1, 2, 3])
| map(x => x * 3)
| drain(console.log)

// into:

pull(
  values([1, 2, 3])
  map(x => x * 3),
  drain(console.log)
)
```

You can also create streams from other streams (known as a "partial"):

```js
const foo =
  infinity() 
  | map(x => x * 100)
  | filter(x => x % 2)

// Use it in another pipeline:
foo | drain(console.log)
```

See [`babel-plugin-pull`](https://npmjs.com/babel-plugin-pull) for more details

### Implicit return value

You don't need to return the last value in a function:

```js
function foo (x) {
  x % 1 !== 0
}
```

This is especially useful in combination with the pipe operator and partial streams:

```js
function foo ({ modifier }) {
  values([ 1, 2, 3 ])
  | map(x => x * modifier)
}

foo({ modifier: 3 })
| drain(console.log)
```

See [`babel-plugin-implicit-return`](https://npmjs.com/babel-plugin-implicit-return) for more details

### JSX pragma `h`

With [`transform-react-jsx`](https://npmjs.com/babel-plugin-transform-react-jsx) + `pragma: 'h'` you have more high-level sytnax creating views with functions.

```js
function foo (e, data) {
  <div onclick=${e}>${data}</div>
}
```

You can use this with librares like [`hyperapp`](https://npmjs.com/hyperapp) instead of having to load `babelify` + the plugin.

---

Maintained by [Jamen Marz](https://git.io/jamen) (See on [Twitter](https://twitter.com/jamenmarz) and [GitHub](https://github.com/jamen) for questions & updates)

