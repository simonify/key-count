import keyCount, { ADD, REMOVE } from '../src';

const presence = keyCount();

presence.subscribe(['users'], ({ type, payload: { key } }) => {
  if (type === ADD) {
    console.log(key, 'came online');
  } else if (type === REMOVE) {
    console.log(key, 'went offline');
  }
});

presence.increment('users', 'simon'); // 1 - "simon came online"
presence.increment(['users', 'simon']); // 2
console.log(presence.getCount(['users', 'simon'])); // 2
presence.decrement(['users', 'simon']); // 1
presence.decrement(['users', 'simon']); // 0 - "simon went offline"
console.log(presence.getCount(['users', 'simon'])); // 0
