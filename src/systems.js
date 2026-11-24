// STUB. The building's systems (sprinklers, fire test, lights, lift, doors, PA) are being written elsewhere;
// this file only holds the contract, so that the security desk's terminal (src/secdesk.js, src/secterm.js)
// has something to talk to until the real one is merged over it. Take the real file whole: nothing here is
// worth keeping.
//
//   G.systems.list()        -> [{ id, name, usage, about }]
//   G.systems.run(id, args) -> { ok, lines: [string], sound? }      (may also be a promise of one)
//   G.systems.zones(), wings(), state(), wetAt(x, z, y); and onEvent, set by the desk to hear what is said later
//
// The desk uses G.systems if the game has one, and otherwise `systems` from this file.

const LIST = [
  { id: 'sprinklers', name: 'Sprinklers', usage: 'sprinklers', about: 'offline' },
  { id: 'firetest', name: 'Fire suppression test', usage: 'firetest', about: 'offline' },
  { id: 'lights', name: 'Lighting', usage: 'lights', about: 'offline' },
  { id: 'lift', name: 'Service lift', usage: 'lift', about: 'offline' },
  { id: 'doors', name: 'Doors', usage: 'doors', about: 'offline' },
  { id: 'pa', name: 'Public address', usage: 'pa', about: 'offline' },
];
export const systems = {
  stub: true,
  list: () => LIST.map(s => ({ ...s })),
  run: id => ({ ok: false, lines: [`${id}: system offline.`] }),
  zones: () => [], wings: () => [], state: () => ({}), wetAt: () => false, onEvent: null,
};
