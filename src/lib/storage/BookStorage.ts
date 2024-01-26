export default interface BookStorage {
  initStorage: () => Promise<void>;
  get: () => Promise<Uint8Array>;
  save: (rawBook: Uint8Array) => Promise<void>;
} // eslint-disable-line semi
