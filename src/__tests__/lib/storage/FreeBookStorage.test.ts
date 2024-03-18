import BookStorage from '@/lib/storage/FreeBookStorage';

describe('FreeBookStorage', () => {
  let instance: BookStorage;

  beforeEach(() => {
    instance = new BookStorage();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('initStorage', () => {
    it('inits storage', async () => {
      await instance.initStorage();
      expect(instance.fileName).toEqual('free');
    });
  });

  describe('get', () => {
    it('does nothing', async () => {
      await instance.get();
    });
  });

  describe('save', () => {
    it('does nothing', async () => {
      await instance.save();
    });
  });
});
