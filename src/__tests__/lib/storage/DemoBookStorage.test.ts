import pako from 'pako';

import BookStorage from '@/lib/storage/DemoBookStorage';

describe('DemoBookStorage', () => {
  let rawBook: Uint8Array;
  let instance: BookStorage;
  let mockFetch: jest.SpyInstance;

  beforeEach(() => {
    rawBook = pako.gzip('rawBook');
    instance = new BookStorage();

    global.fetch = jest.fn();
    mockFetch = jest.spyOn(global, 'fetch');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('initStorage', () => {
    it('inits storage', async () => {
      await instance.initStorage();
      expect(instance.fileName).toEqual('demo');
    });
  });

  describe('get', () => {
    beforeEach(async () => {
      mockFetch = jest.spyOn(global, 'fetch').mockImplementation(
        jest.fn(() => Promise.resolve({
          arrayBuffer: () => Promise.resolve(rawBook.buffer),
        })) as jest.Mock,
      );
      await instance.initStorage();
    });

    it('returns decompressed data from downloaded file', async () => {
      const content = await instance.get();

      expect(mockFetch).toHaveBeenNthCalledWith(
        1,
        '/books/demo.sqlite.gz',
        {
          headers: new Headers({
            'content-type': 'application/vnd.sqlite3',
          }),
          method: 'GET',
        },
      );
      expect(content).toEqual(pako.ungzip(rawBook));
    });
  });

  describe('save', () => {
    it('does nothing', async () => {
      await instance.save();
    });
  });
});
