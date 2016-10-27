import { Map } from 'immutable';
import createDispatcher from 'create-dispatcher';

export const ADD = 'key-count/ADD';
export const REMOVE = 'key-count/REMOVE';
export const INCREMENT = 'key-count/INCREMENT';
export const DECREMENT = 'key-count/DECREMENT';
export const TOTAL = 'key-count/TOTAL';

export const ASSIGN_NESTED_TO_NUMBER = 'trying to assign a nested value to a single count';
export const ASSIGN_NUMBER_TO_NESTED = 'trying to assign a single value to a nested count';
export const ACCESS_NESTED_AS_NUMBER = 'trying to access a nested value as a single count';
export const ACCESS_NUMBER_AS_NESTED = 'trying to access a single count as a nested value';

function flatten(arr) {
  return arr.reduce((a, b) => (
    a.concat(Array.isArray(b) ? flatten(b) : b)
  ), []).filter(v => typeof v === 'string');
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
    if (typeof args[1] === 'undefined') {
      return _subscribe(args[0]);
    }

    const receiver = args.pop();
    const path = flatten(args);

    return _subscribe(JSON.stringify(path), receiver);
  }

  function getState() {
    return state;
  }

  function setState(newState) {
    state = newState;
    return state;
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

  const has = () => getCount() > 0;

  function getKeys(...paths) {
    const path = flatten(paths);
    const value = state.getIn(path);

    if (typeof value === 'number') {
      throw new Error(ACCESS_NUMBER_AS_NESTED);
    }

    if (typeof value !== 'object' || value.size === 0) {
      return [];
    }

    return value.remove(TOTAL).keySeq().toJS();
  }

  function remove(...paths) {
    const path = flatten(paths);

    let farthestPath = path;

    for (let i = path.length - 1; i > 0; i -= 1) {
      const pathToFragment = path.slice(0, i);
      const totalValue = state.getIn([...pathToFragment, TOTAL]);

      if (totalValue > 1) {
        break;
      }

      farthestPath = pathToFragment;

      const parentPath = pathToFragment.slice(0, -1);

      dispatch({ type: DECREMENT, payload: { path: parentPath, key: path[i - 1], count: 0 } });
      dispatch({ type: REMOVE, payload: { path: parentPath, key: path[i - 1], count: 0 } });
    }

    const totalPath = [...farthestPath.slice(0, -1), TOTAL];

    state = state.setIn(totalPath, state.getIn(totalPath) - 1);
    state = state.deleteIn(farthestPath);

    return true;
  }

  function increment(amount, ...paths) {
    if (typeof amount !== 'number') {
      paths.unshift(amount);
      amount = 1;
    }

    const path = flatten(paths);
    const events = [];
    const pathToKey = [...path];
    const key = pathToKey.pop();

    let newState = state;

    for (let i = 0; i < pathToKey.length; i += 1) {
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
      const totalKeyPath = [...path.slice(0, path.length - 1), TOTAL];
      newState = newState.setIn(totalKeyPath, newState.getIn(totalKeyPath) + 1);
      events.push([ADD, {
        key,
        count: 1,
        path: pathToKey
      }]);
    }

    const count = newState.getIn(path) + amount;

    newState = newState.setIn(path, count);

    events.push([INCREMENT, { path: pathToKey, key, count }]);

    setState(newState);

    events.forEach(([type, payload]) => dispatch({ type, payload }));

    return count;
  }

  function decrement(amount, ...paths) {
    if (typeof amount !== 'number') {
      paths.unshift(amount);
      amount = 1;
    }

    const path = flatten(paths);
    const value = state.getIn(path);

    if (typeof value === 'undefined') {
      return 0;
    }

    if (typeof value === 'object') {
      throw new Error(ASSIGN_NUMBER_TO_NESTED);
    }

    const newValue = Math.max(0, value - amount);
    const pathToKey = path.slice(0, path.length - 1);
    const key = path[path.length - 1];

    dispatch({
      type: DECREMENT,
      payload: {
        path: pathToKey,
        count: newValue,
        key
      }
    });

    if (newValue === 0) {
      dispatch({
        type: REMOVE,
        payload: {
          path: pathToKey,
          count: newValue,
          key
        }
      });

      remove(path);
      setState(state);

      return 0;
    }

    setState(state.setIn(path, newValue));

    return newValue;
  }

  return { decrement, getCount, getKeys, getState, has, increment, remove, subscribe };
}
