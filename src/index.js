import { Map } from 'immutable';
import createDispatcher from 'create-dispatcher';

export const ADD = 'key-count/ADD';
export const REMOVE = 'key-count/REMOVE';
export const INCREMENT = 'key-count/INCREMENT';
export const DECREMENT = 'key-count/DECREMENT';
export const TOTAL = 'key-count/TOTAL';

export const ASSIGN_NESTED_TO_NUMBER = 'trying to assign a nested value to a single count';
export const ASSIGN_NUMBER_TO_NESTED = 'trying to assign a single value to a nested count';

function flatten(arr) {
  return arr.reduce((a, b) => a.concat(Array.isArray(b) ? flatten(b) : b), []);
}

export default function keyCount() {
  const { dispatch: _dispatch, subscribe: _subscribe } = createDispatcher();

  let state = new Map({ [TOTAL]: 0 });

  /**
   * Compose the dispatch/subscribe methods to support key paths.
   */
  function dispatch(event) {
    _dispatch(event);

    if (typeof event.payload === 'object' && typeof event.payload.path === 'object') {
      _dispatch(JSON.stringify(event.payload.path), event);

      if (event.payload.path.length && typeof event.payload.key === 'string') {
        _dispatch(JSON.stringify([...event.payload.path, event.payload.key]), event);
      }
    }
  }

  function subscribe(...args) {
    const createReceiver = (receiver) => (channel, event) => receiver(event);

    if (typeof args[1] === 'undefined') {
      return _subscribe(createReceiver(args[0]));
    }

    const receiver = args.pop();
    const path = flatten(args);

    return _subscribe(JSON.stringify(path), createReceiver(receiver));
  }

  function getState() {
    return state;
  }

  function setState(newState) {
    state = newState;
  }

  function getCount(...paths) {
    const path = flatten(paths);

    if (path.length === 0) {
      return state.get(TOTAL);
    }

    const value = state.getIn(path);

    switch (typeof value) {
      case 'object':
        return value.get(TOTAL);
      case 'number':
        return value;
      default:
        return 0;
    }
  }

  function increment(...paths) {
    const path = flatten(paths);
    const events = [];

    const pathToKey = [...path];
    const key = pathToKey.pop();

    let newState = state;

    for (let i = 0; i < pathToKey.length; i++) {
      const pathToFragment = pathToKey.slice(0, i);
      const fragment = pathToKey[i];
      const fragmentPath = [...pathToFragment, fragment];
      const value = newState.getIn(fragmentPath);

      if (typeof value === 'undefined') {
        const totalPath = [...pathToFragment, TOTAL];
        const totalCount = newState.getIn(totalPath) + 1;

        newState = newState.setIn(totalPath, totalCount);
        newState = newState.setIn(fragmentPath, new Map({ [TOTAL]: 0 }));

        events.push([ADD, {
          count: totalCount,
          key: fragment,
          path: pathToFragment
        }]);

        events.push([INCREMENT, {
          count: 1,
          key: fragment,
          path: pathToFragment
        }]);
      }

      if (typeof value === 'number') {
        throw new Error(ASSIGN_NESTED_TO_NUMBER);
      }
    }

    const value = newState.getIn(path);

    if (typeof value === 'object') {
      throw new Error(ASSIGN_NUMBER_TO_NESTED);
    }

    if (typeof value === 'undefined') {
      newState = newState.setIn(path, 0);
      newState = newState.setIn([...path.slice(0, path.length - 1), TOTAL], 1);
      events.push([ADD, {
        key,
        count: 1,
        path: pathToKey
      }]);
    }

    const count = newState.getIn(path) + 1;

    newState = newState.setIn(path, count);

    events.push([INCREMENT, { path: pathToKey, key, count }]);

    setState(newState);

    for (const [type, payload] of events) {
      dispatch({ type, payload });
    }

    return count;
  }

  function decrement(...paths) {
    const path = flatten(paths);
    const events = [];

    let newState = state;

    const value = newState.getIn(path);

    if (typeof value === 'undefined') {
      return 0;
    }

    if (typeof value === 'object') {
      throw new Error(ASSIGN_NUMBER_TO_NESTED);
    }

    const newValue = value - 1;
    const pathToKey = path.slice(0, path.length - 1);
    const key = path[path.length - 1];

    events.push([DECREMENT, {
      path: pathToKey,
      count: newValue,
      key
    }]);

    if (value === 1) {
      events.push([REMOVE, {
        path: pathToKey,
        count: newValue,
        key
      }]);

      let farthestPath = path;

      for (let i = path.length - 1; i > 0; i--) {
        const pathToFragment = path.slice(0, i);
        const totalValue = newState.getIn([...pathToFragment, TOTAL]);

        if (totalValue > 1) {
          break;
        }

        farthestPath = pathToFragment;

        const parentPath = pathToFragment.slice(0, -1);

        events.push([DECREMENT, { path: parentPath, key: path[i - 1], count: 0 }]);
        events.push([REMOVE, { path: parentPath, key: path[i - 1], count: 0 }]);
      }

      if (farthestPath) {
        const totalPath = [...farthestPath.slice(0, -1), TOTAL];
        newState = newState.setIn(totalPath, newState.getIn(totalPath) - 1);
        newState = newState.deleteIn(farthestPath);
      }
    } else {
      newState = newState.setIn(path, newValue);
    }

    setState(newState);

    for (const [type, payload] of events) {
      dispatch({ type, payload });
    }

    return newValue;
  }

  return { decrement, getCount, getState, increment, subscribe };
}
