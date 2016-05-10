# key-count

`key-count` is a simple JavaScript module for keeping collections of keyed integers that can be incremented/decremented and observed.

[![build status](https://img.shields.io/travis/simonify/key-count/master.svg)](https://travis-ci.org/simonify/key-count)
[![npm version](https://img.shields.io/npm/v/key-count.svg)](https://www.npmjs.com/package/key-count)
[![npm downloads](https://img.shields.io/npm/dm/key-count.svg)](https://www.npmjs.com/package/key-count)

## Install
```bash
npm install key-count --save
```

## Usage
`key-count` can easily be used to create a presence tracker:

```js
import keyCount, { ADD, REMOVE } from 'key-count';

const presence = keyCount();
const unsubscribe = presence.subscribe(['users'], ({ type, payload }) => {
  if (type === ADD) {
    console.log(payload.key, 'came online');
  } else if (type === REMOVE) {
    console.log(payload.key, 'went offline');
  }
});

presence.getCount(['users']); // 0
presence.increment('users', 'simon'); // 1 - "simon came online"
presence.increment(['users', 'simon']); // 2
presence.getCount(['users']); // 1
presence.getCount(['users', 'simon']); // 2
presence.decrement(['users', 'simon']); // 1
presence.decrement(['users', 'simon']); // 0 - "simon went offline"

unsubscribe();
```

## API

The module exports a default function `keyCount` which can be used to create a `key-count` instance. An instance has the following shape:

```js
{
  increment: (Path) => Number,
  decrement: (Path) => Number
  getCount: (Path) => Number,
  subscribe: (Path, receiver:Function) => unsubscribe:Function
  subscribe: (receiver:Function) => unsubscribe:Function
}
```

A `Path` can be a single value, an array of values or values spread across multiple arguments. For example, the following represent the same operation:

```js
presence.increment('users', 'simon');
presence.increment(['users', 'simon']);
```

## Events

The `subscribe` function can either be called with a single argument or two or more arguments.

If a single argument is provided, it must be a `receiver` function which will be called when any event is dispatched.

If two or more arguments are provided, `arguments[0...arguments.length - 1]` will be flattened to create a `Path` and the last argument will be treated as a `receiver` function. Only events which affect the Path will cause the receiver to be called. For example, if you call `subscribe('users', onChange)` then only mutations to direct children of the path will trigger the receiver (e.g. `increment('users', 'simon')`).

The `subscribe` function will return an `unsubscribe` function which can be called to cancel the subscription.

The module exports four event type constants:

* `ADD` - A key has been added to a Path (key's value became `1`).
* `REMOVE` - A key has been removed from a Path (key's value became `0`).
* `INCREMENT` - A key's value has been increased.
* `DECREMENT` - A key's value has decreased.

Each event dispatched has the following shape:
```js
{ type: String, payload: { path: Array, key: String, count: Number } }
```

## License

MIT
