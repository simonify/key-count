import { Map } from 'immutable';
import expect, { createSpy } from 'expect';
import keyCount, {
  ADD, REMOVE, INCREMENT, DECREMENT, ASSIGN_NUMBER_TO_NESTED, ASSIGN_NESTED_TO_NUMBER
} from '../src';

describe('key-count', () => {
  describe('#increment', () => {
    it('should increment to 1 when no value exists', () => {
      const instance = keyCount();
      const path = ['path', 'to', 'key'];
      expect(instance.getCount(path)).toBe(0);
      expect(instance.increment(path)).toBe(1);
      expect(instance.getCount(path)).toBe(1);
    });

    it('should increment when a prior exists', () => {
      const instance = keyCount();
      const path = ['path', 'to', 'key'];
      expect(instance.getCount(path)).toBe(0);
      expect(instance.increment(path)).toBe(1);
      expect(instance.increment(path)).toBe(2);
      expect(instance.getCount(path)).toBe(2);
    });

    it('should accept a single string as a path', () => {
      const instance = keyCount();
      expect(instance.getCount('path')).toBe(0);
      expect(instance.increment('path')).toBe(1);
      expect(instance.getCount('path')).toBe(1);
    });

    it('should accept an array as a path', () => {
      const instance = keyCount();
      expect(instance.getCount(['path'])).toBe(0);
      expect(instance.increment(['path'])).toBe(1);
      expect(instance.getCount(['path'])).toBe(1);

      expect(instance.getCount(['nested', 'path'])).toBe(0);
      expect(instance.increment(['nested', 'path'])).toBe(1);
      expect(instance.getCount(['nested', 'path'])).toBe(1);
    });

    it('should accept multiple arguments as a path', () => {
      const instance = keyCount();
      expect(instance.getCount('nested', 'path')).toBe(0);
      expect(instance.increment('nested', 'path')).toBe(1);
      expect(instance.getCount('nested', 'path')).toBe(1);
    });

    it('shouldnt allow assign a collection to a single value', () => {
      const instance = keyCount();
      instance.increment('single');
      expect(() => instance.increment('single', 'nested')).toThrow(ASSIGN_NESTED_TO_NUMBER);
    });

    it('shouldnt allow trying to increment a collection', () => {
      const instance = keyCount();
      instance.increment(['nested', 'value']);
      expect(() => instance.increment('nested')).toThrow(ASSIGN_NUMBER_TO_NESTED);
    });
  });

  describe('#decrement', () => {
    it('should be a no-op when a path doesnt exist', () => {
      const instance = keyCount();
      const path = ['path', 'to', 'key'];
      expect(instance.getCount(path)).toBe(0);
      expect(instance.decrement(path)).toBe(0);
      expect(instance.getCount(path)).toBe(0);
    });

    it('should decrement when a prior exists', () => {
      const instance = keyCount();
      const path = ['path', 'to', 'key'];
      expect(instance.getCount(path)).toBe(0);

      instance.increment(path);
      instance.increment(path);
      instance.increment(path);

      expect(instance.getCount(path)).toBe(3);
      expect(instance.decrement(path)).toBe(2);
      expect(instance.decrement(path)).toBe(1);
      expect(instance.decrement(path)).toBe(0);
      expect(instance.getCount(path)).toBe(0);
    });

    it('should accept a single string as a path', () => {
      const instance = keyCount();
      expect(instance.getCount('path')).toBe(0);
      expect(instance.increment('path')).toBe(1);
      expect(instance.decrement('path')).toBe(0);
      expect(instance.getCount('path')).toBe(0);
    });

    it('should accept an array as a path', () => {
      const instance = keyCount();
      expect(instance.getCount(['path'])).toBe(0);
      expect(instance.increment(['path'])).toBe(1);
      expect(instance.getCount(['path'])).toBe(1);
      expect(instance.decrement(['path'])).toBe(0);
      expect(instance.getCount(['path'])).toBe(0);

      expect(instance.getCount(['nested', 'path'])).toBe(0);
      expect(instance.increment(['nested', 'path'])).toBe(1);
      expect(instance.getCount(['nested', 'path'])).toBe(1);
      expect(instance.decrement(['nested', 'path'])).toBe(0);
      expect(instance.getCount(['nested', 'path'])).toBe(0);
    });

    it('should accept multiple arguments as a path', () => {
      const instance = keyCount();
      expect(instance.getCount('nested', 'path')).toBe(0);
      expect(instance.increment('nested', 'path')).toBe(1);
      expect(instance.getCount('nested', 'path')).toBe(1);
      expect(instance.decrement('nested', 'path')).toBe(0);
      expect(instance.getCount('nested', 'path')).toBe(0);
    });

    it('shouldnt allow trying to decrement a collection', () => {
      const instance = keyCount();
      instance.increment(['nested', 'value']);
      expect(() => instance.decrement('nested')).toThrow(ASSIGN_NUMBER_TO_NESTED);
    });
  });

  describe('#getCount', () => {
    it('should return 0 if an invalid/empty path is provided', () => {
      const instance = keyCount();
      expect(instance.getCount([123])).toBe(0);
      expect(instance.getCount([false])).toBe(0);
      expect(instance.getCount(['path', 'doesnt', 'exist'])).toBe(0);
      expect(instance.getCount('string path')).toBe(0);
      expect(instance.getCount('nested', 'path')).toBe(0);
    });

    it('should return the correct count of a path', () => {
      const instance = keyCount();
      const path = ['path', 'to', 'key'];
      expect(instance.getCount(path)).toBe(0);
      expect(instance.increment(path)).toBe(1);
      expect(instance.increment(...path)).toBe(2);
      expect(instance.getCount(path)).toBe(2);
      expect(instance.decrement(path)).toBe(1);
      expect(instance.getCount(path)).toBe(1);
      expect(instance.decrement(...path)).toBe(0);
      expect(instance.getCount(path)).toBe(0);
    });
  });

  describe('#getState', () => {
    it('should return a state Map', () => {
      const instance = keyCount();
      expect(instance.getState()).toBeA(Map);
    });
  });

  describe('#subscribe', () => {
    it('should allow subscribing to a path', () => {
      const instance = keyCount();
      const spy = createSpy((event) => {});
      const unsubscribe = instance.subscribe(['specific', 'path'], spy);

      instance.increment(['different', 'path']);

      expect(spy).toNotHaveBeenCalled();

      instance.increment(['specific', 'path']);

      expect(spy).toHaveBeenCalled();

      unsubscribe();
    });
  });

  describe('#remove', () => {
    it('should set the count to 0 for the path provided', () => {
      const instance = keyCount();

      instance.increment(['a', 'deep', 'path']);
      instance.increment(['a', 'nested', 'path']);
      expect(instance.getCount(['a'])).toBe(2);
      expect(instance.getCount(['a', 'deep'])).toBe(1);
      expect(instance.getCount(['a', 'deep', 'path'])).toBe(1);
      expect(instance.getCount(['a', 'nested'])).toBe(1);
      expect(instance.getCount(['a', 'nested', 'path'])).toBe(1);
      instance.remove(['a', 'deep', 'path']);
      expect(instance.getCount(['a'])).toBe(1);
      expect(instance.getCount(['a', 'deep'])).toBe(0);
      expect(instance.getCount(['a', 'deep', 'path'])).toBe(0);
      expect(instance.getCount(['a', 'nested'])).toBe(1);
      expect(instance.getCount(['a', 'nested', 'path'])).toBe(1);
    });
  });

  describe('event behaviour', () => {
    it(`should dispatch ${ADD} and ${INCREMENT} events when adding a new root key`, () => {
      const spy = createSpy();
      const instance = keyCount();
      const unsubscribe = instance.subscribe(spy);

      instance.increment('simon');

      expect(spy.calls.length).toBe(2);

      expect(spy.calls[0].arguments[0]).toEqual({
        type: ADD,
        payload: {
          path: [],
          count: 1,
          key: 'simon'
        }
      });

      expect(spy.calls[1].arguments[0]).toEqual({
        type: INCREMENT,
        payload: {
          path: [],
          count: 1,
          key: 'simon'
        }
      });

      unsubscribe();
    });

    it(`should only dispatch ${INCREMENT} when the key has an existing value`, () => {
      const spy = createSpy();
      const instance = keyCount();

      instance.increment('simon');
      const unsubscribe = instance.subscribe(spy);
      instance.increment('simon');

      expect(spy.calls.length).toBe(1);
      expect(spy.calls[0].arguments[0]).toEqual({
        type: INCREMENT,
        payload: {
          path: [],
          count: 2,
          key: 'simon'
        }
      });

      unsubscribe();
    });

    it(`should dispatch ${ADD} and ${INCREMENT} events for each new fragment in a path`, () => {
      const spy = createSpy();
      const instance = keyCount();
      const unsubscribe = instance.subscribe(spy);

      instance.increment(['a', 'new', 'path']);
      instance.increment(['a', 'new', 'path']);

      expect(spy.calls.length).toBe(7);

      expect(spy.calls[0].arguments[0]).toEqual({
        type: ADD, payload: { path: [], count: 1, key: 'a' }
      });

      expect(spy.calls[1].arguments[0]).toEqual({
        type: INCREMENT, payload: { path: [], count: 1, key: 'a' }
      });

      expect(spy.calls[2].arguments[0]).toEqual({
        type: ADD, payload: { path: ['a'], count: 1, key: 'new' }
      });

      expect(spy.calls[3].arguments[0]).toEqual({
        type: INCREMENT, payload: { path: ['a'], count: 1, key: 'new' }
      });

      expect(spy.calls[4].arguments[0]).toEqual({
        type: ADD, payload: { path: ['a', 'new'], count: 1, key: 'path' }
      });

      expect(spy.calls[5].arguments[0]).toEqual({
        type: INCREMENT, payload: { path: ['a', 'new'], count: 1, key: 'path' }
      });

      expect(spy.calls[6].arguments[0]).toEqual({
        type: INCREMENT, payload: { path: ['a', 'new'], count: 2, key: 'path' }
      });

      unsubscribe();
    });

    it(`should not dispatch ${DECREMENT} when the value is already 0`, () => {
      const spy = createSpy();
      const instance = keyCount();
      const unsubscribe = instance.subscribe(spy);

      instance.decrement('path');
      instance.decrement('a', 'path');
      instance.decrement(['a', 'new', 'path']);

      expect(spy.calls.length).toBe(0);

      unsubscribe();
    });

    it(`should dispatch ${DECREMENT} until the value is 0 and then ${REMOVE}`, () => {
      const spy = createSpy();
      const instance = keyCount();

      instance.increment('path');
      instance.increment('path');

      const unsubscribe = instance.subscribe(spy);

      instance.decrement('path');
      instance.decrement('path');
      instance.decrement('path'); // no-op

      expect(spy.calls.length).toBe(3);

      expect(spy.calls[0].arguments[0]).toEqual({
        type: DECREMENT, payload: { path: [], count: 1, key: 'path' }
      });

      expect(spy.calls[1].arguments[0]).toEqual({
        type: DECREMENT, payload: { path: [], count: 0, key: 'path' }
      });

      expect(spy.calls[2].arguments[0]).toEqual({
        type: REMOVE, payload: { path: [], count: 0, key: 'path' }
      });

      unsubscribe();
    });

    it(`should dispatch ${DECREMENT} and ${REMOVE} for each empty nested path removed`, () => {
      const spy = createSpy();
      const instance = keyCount();

      instance.increment(['a', 'nested', 'path']);

      const unsubscribe = instance.subscribe(spy);

      instance.decrement(['a', 'nested', 'path']);

      expect(spy.calls.length).toBe(6);

      expect(spy.calls[0].arguments[0]).toEqual({
        type: DECREMENT, payload: { path: ['a', 'nested'], count: 0, key: 'path' }
      });

      expect(spy.calls[1].arguments[0]).toEqual({
        type: REMOVE, payload: { path: ['a', 'nested'], count: 0, key: 'path' }
      });

      expect(spy.calls[2].arguments[0]).toEqual({
        type: DECREMENT, payload: { path: ['a'], count: 0, key: 'nested' }
      });

      expect(spy.calls[3].arguments[0]).toEqual({
        type: REMOVE, payload: { path: ['a'], count: 0, key: 'nested' }
      });

      expect(spy.calls[4].arguments[0]).toEqual({
        type: DECREMENT, payload: { path: [], count: 0, key: 'a' }
      });

      expect(spy.calls[5].arguments[0]).toEqual({
        type: REMOVE, payload: { path: [], count: 0, key: 'a' }
      });

      unsubscribe();
    });
  });
});
