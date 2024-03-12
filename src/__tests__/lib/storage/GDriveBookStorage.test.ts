import pako from 'pako';

import BookStorage from '@/lib/storage/GDriveBookStorage';

describe('GoogleDrive', () => {
  let rawBook: Uint8Array;
  let instance: BookStorage;
  let mockDriveClient: typeof gapi.client.drive;
  let mockGapiClient: typeof gapi.client;
  let mockFetch: jest.SpyInstance;

  beforeEach(() => {
    rawBook = pako.gzip('rawBook');
    mockDriveClient = {
      files: {
        // @ts-ignore
        list: jest.fn(async () => (
          {
            result: {
              files: [],
            },
          }
        )),
        // @ts-ignore
        create: jest.fn(async () => (
          {
            result: {
              id: 'createdResourceId',
            },
          }
        )),
      },
    };
    mockGapiClient = {
      // @ts-ignore
      request: jest.fn(async () => {}),
      drive: mockDriveClient,
      getToken: () => ({
        access_token: 'ACCESS_TOKEN',
        error: '',
        expires_in: 'never',
        state: 'state',
      }),
    };
    instance = new BookStorage(mockGapiClient);

    global.fetch = jest.fn();
    mockFetch = jest.spyOn(global, 'fetch');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('findParentFolderId', () => {
    it('calls list with expected params', async () => {
      // @ts-ignore
      await instance.findParentFolderId();
      expect(mockDriveClient.files.list).toHaveBeenNthCalledWith(
        1,
        {
          q: 'mimeType = \'application/vnd.google-apps.folder\' and name=\'maffin.io\' and trashed = false',
        },
      );
    });

    it('returns parentFolderId when found', async () => {
      // @ts-ignore
      mockDriveClient.files.list = jest.fn(async () => (
        {
          result: {
            files: [
              {
                id: 'parentFolderId',
              },
            ],
          },
        }
      ));
      // @ts-ignore
      const parentFolderId = await instance.findParentFolderId();
      expect(parentFolderId).toEqual('parentFolderId');
    });

    it('returns empty string when not found', async () => {
      // @ts-ignore
      const parentFolderId = await instance.findParentFolderId();
      expect(parentFolderId).toEqual('');
    });

    it('throws UNKNOWN when 500', async () => {
      mockDriveClient.files.list = jest.fn(() => {
        // eslint-disable-next-line @typescript-eslint/no-throw-literal
        throw {
          status: 500,
        };
      }) as jest.Mock;

      // @ts-ignore
      await expect(() => instance.findParentFolderId()).rejects.toThrowError(
        expect.objectContaining({
          message: 'Failed to fetch',
          code: 'OFFLINE',
        }),
      );
    });
  });

  describe('findBookFileId', () => {
    beforeEach(() => {
      // @ts-ignore
      instance.parentFolderId = 'parentFolderId';
    });

    it('calls list with expected params', async () => {
      // @ts-ignore
      await instance.findBookFileId('book1');
      expect(mockDriveClient.files.list).toHaveBeenNthCalledWith(
        1,
        {
          q: 'name=\'book1.sqlite.gz\' and trashed = false and \'parentFolderId\' in parents',
        },
      );
    });

    it('returns bookFileId when found', async () => {
      // @ts-ignore
      mockDriveClient.files.list = jest.fn(async () => (
        {
          result: {
            files: [
              {
                id: 'bookFileId',
              },
            ],
          },
        }
      ));
      // @ts-ignore
      const bookFileId = await instance.findBookFileId('book1');
      expect(bookFileId).toEqual('bookFileId');
    });

    it('returns empty string when not found', async () => {
      // @ts-ignore
      const bookFileId = await instance.findBookFileId('book1');
      expect(bookFileId).toEqual('');
    });

    it('throws Invalid token when 401', async () => {
      mockDriveClient.files.list = jest.fn(() => {
        // eslint-disable-next-line @typescript-eslint/no-throw-literal
        throw {
          status: 401,
        };
      }) as jest.Mock;

      // @ts-ignore
      await expect(() => instance.findBookFileId('book1')).rejects.toThrowError(
        expect.objectContaining({
          message: 'Invalid token',
          code: 'UNAUTHORIZED',
        }),
      );
    });
  });

  describe('initStorage', () => {
    beforeEach(() => {
      // @ts-ignore
      jest.spyOn(instance, 'findParentFolderId').mockReturnValue(Promise.resolve('parentFolderId'));
      // @ts-ignore
      jest.spyOn(instance, 'findBookFileId').mockReturnValue(Promise.resolve('bookFileId'));
    });

    it('calls findParentFolderId', async () => {
      await instance.initStorage();
      // @ts-ignore
      expect(instance.findParentFolderId).toHaveBeenCalledTimes(1);
    });

    it('creates parent folder and book file when not initialised', async () => {
      // @ts-ignore
      jest.spyOn(instance, 'findParentFolderId').mockReturnValue(Promise.resolve(''));
      // @ts-ignore
      jest.spyOn(instance, 'findBookFileId').mockReturnValue(Promise.resolve(''));
      mockFetch = jest.spyOn(global, 'fetch').mockImplementation(
        jest.fn(() => Promise.resolve({
          json: () => Promise.resolve({ id: 'createdResourceId' }),
        })) as jest.Mock,
      );
      await instance.initStorage();
      // @ts-ignore
      expect(instance.parentFolderId).toEqual('createdResourceId');
      // @ts-ignore
      expect(instance.bookFileId).toEqual('createdResourceId');
      expect(mockDriveClient.files.create).toHaveBeenNthCalledWith(
        1,
        {
          fields: 'id',
          resource: {
            name: 'maffin.io',
            mimeType: 'application/vnd.google-apps.folder',
          },
        },
      );
      expect(mockDriveClient.files.create).toHaveBeenNthCalledWith(
        2,
        {
          fields: 'id',
          resource: {
            name: 'book1.sqlite.gz',
            mimeType: 'application/vnd.sqlite3',
            parents: ['createdResourceId'],
          },
        },
      );
    });

    it('doesnt recreate when initialised', async () => {
      // @ts-ignore
      mockDriveClient.files.list = jest.fn(async () => (
        {
          result: {
            files: [
              {
                id: 'parentFolderId',
              },
            ],
          },
        }
      ));
      await instance.initStorage();
      // @ts-ignore
      expect(instance.parentFolderId).toEqual('parentFolderId');
      expect(mockDriveClient.files.create).not.toHaveBeenCalled();
    });

    it('calls findBookFileId', async () => {
      await instance.initStorage();
      // @ts-ignore
      expect(instance.findBookFileId).toHaveBeenCalledTimes(1);
    });
  });

  describe('get', () => {
    beforeEach(() => {
      mockFetch = jest.spyOn(global, 'fetch').mockImplementation(
        jest.fn(() => Promise.resolve({
          arrayBuffer: () => Promise.resolve(rawBook.buffer),
        })) as jest.Mock,
      );
      jest.spyOn(instance, 'initStorage');
    });

    it('returns decompressed data from downloaded file', async () => {
      // @ts-ignore
      instance.parentFolderId = 'parentFolderId';
      // @ts-ignore
      instance.bookFileId = 'bookFileId';
      const content = await instance.get();

      expect(mockFetch).toHaveBeenNthCalledWith(
        1,
        'https://www.googleapis.com/drive/v3/files/bookFileId?alt=media',
        {
          headers: new Headers({
            authorization: 'Bearer ACCESS_TOKEN',
            'content-type': 'application/vnd.sqlite3',
          }),
          method: 'GET',
        },
      );
      expect(content).toEqual(pako.ungzip(rawBook));
    });
  });

  describe('save', () => {
    beforeEach(() => {
      jest.spyOn(instance, 'initStorage');
    });

    it('saves book as expected', async () => {
      mockFetch = jest.spyOn(global, 'fetch').mockImplementation(
        jest.fn(() => Promise.resolve({
          status: 200,
        })) as jest.Mock,
      );
      // @ts-ignore
      instance.parentFolderId = 'parentFolderId';
      // @ts-ignore
      instance.bookFileId = 'bookFileId';
      await instance.save(rawBook);

      expect(mockFetch).toHaveBeenNthCalledWith(
        1,
        'https://www.googleapis.com/upload/drive/v3/files/bookFileId',
        {
          method: 'PATCH',
          headers: new Headers({
            authorization: 'Bearer ACCESS_TOKEN',
            'content-type': 'application/vnd.sqlite3',
          }),
          body: expect.any(Blob),
        },
      );

      const blob = mockFetch.mock.calls[0][1].body as Blob;
      const resultBlobData = await fileToArrayBuffer(blob);
      const expectedBlobData = await fileToArrayBuffer(blob);
      expect(resultBlobData).toEqual(expectedBlobData);
    });

    it('throws Invalid token when 401', async () => {
      mockFetch = jest.spyOn(global, 'fetch').mockImplementation(
        jest.fn(() => Promise.resolve({
          status: 401,
        })) as jest.Mock,
      );

      await expect(() => instance.save(rawBook)).rejects.toThrowError(expect.objectContaining({
        message: 'Invalid token',
        code: 'UNAUTHORIZED',
      }));
    });

    it('throws Failed to fetch when 500', async () => {
      mockFetch = jest.spyOn(global, 'fetch').mockImplementation(
        jest.fn(() => { throw new Error(); }) as jest.Mock,
      );

      await expect(() => instance.save(rawBook)).rejects.toThrowError(expect.objectContaining({
        message: 'Failed to fetch',
        code: 'OFFLINE',
      }));
    });
  });
});

function fileToArrayBuffer(f: Blob): Promise<string | ArrayBuffer | null> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.readAsArrayBuffer(f);
  });
}
