import BookStorage from '@/apis/BookStorage';

describe('GoogleDrive', () => {
  let rawBook: Uint8Array;
  let client: BookStorage;
  let mockDriveClient: typeof gapi.client.drive;
  let mockGapiClient: typeof gapi.client;
  let mockFetch: jest.SpyInstance;

  beforeEach(() => {
    rawBook = new Uint8Array([22, 33]);
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
    client = new BookStorage(mockGapiClient);

    global.fetch = jest.fn();
    mockFetch = jest.spyOn(global, 'fetch');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('findParentFolderId', () => {
    it('calls list with expected params', async () => {
      await client.findParentFolderId();
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
      const parentFolderId = await client.findParentFolderId();
      expect(parentFolderId).toEqual('parentFolderId');
    });

    it('returns empty string when not found', async () => {
      const parentFolderId = await client.findParentFolderId();
      expect(parentFolderId).toEqual('');
    });
  });

  describe('findBookFileId', () => {
    beforeEach(() => {
      client.parentFolderId = 'parentFolderId';
    });

    it('calls list with expected params', async () => {
      await client.findBookFileId('book1');
      expect(mockDriveClient.files.list).toHaveBeenNthCalledWith(
        1,
        {
          q: 'name=\'book1.sqlite\' and trashed = false and \'parentFolderId\' in parents',
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
      const bookFileId = await client.findBookFileId('book1');
      expect(bookFileId).toEqual('bookFileId');
    });

    it('returns empty string when not found', async () => {
      const bookFileId = await client.findBookFileId('book1');
      expect(bookFileId).toEqual('');
    });

    it('fails when parentFolderId is not set', async () => {
      client.parentFolderId = '';
      await expect(client.findBookFileId('book1')).rejects.toThrow('Parent folder id is not set');
    });
  });

  describe('initStorage', () => {
    beforeEach(() => {
      jest.spyOn(client, 'findParentFolderId').mockReturnValue(Promise.resolve('parentFolderId'));
      jest.spyOn(client, 'findBookFileId').mockReturnValue(Promise.resolve('bookFileId'));
    });

    it('calls findParentFolderId', async () => {
      await client.initStorage();
      expect(client.findParentFolderId).toHaveBeenCalledTimes(1);
    });

    it('creates parent folder and book file when not initialised', async () => {
      jest.spyOn(client, 'findParentFolderId').mockReturnValue(Promise.resolve(''));
      jest.spyOn(client, 'findBookFileId').mockReturnValue(Promise.resolve(''));
      mockFetch = jest.spyOn(global, 'fetch').mockImplementation(
        jest.fn(() => Promise.resolve({
          json: () => Promise.resolve({ id: 'createdResourceId' }),
        })) as jest.Mock,
      );
      await client.initStorage();
      expect(client.parentFolderId).toEqual('createdResourceId');
      expect(client.bookFileId).toEqual('createdResourceId');
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
            name: 'book1.sqlite',
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
      await client.initStorage();
      expect(client.parentFolderId).toEqual('parentFolderId');
      expect(mockDriveClient.files.create).not.toHaveBeenCalled();
    });

    it('raises an error when cant find parent id after creating', async () => {
      jest.spyOn(client, 'findParentFolderId').mockReturnValue(Promise.resolve(''));
      // @ts-ignore
      mockDriveClient.files.create = jest.fn(async () => (
        {
          result: {
            id: undefined,
          },
        }
      ));

      await expect(client.initStorage()).rejects.toThrow('Couldnt get parent folder id');
    });

    it('calls findBookFileId', async () => {
      await client.initStorage();
      expect(client.findBookFileId).toHaveBeenCalledTimes(1);
    });

    it('raises an error when cant find book id after creating', async () => {
      jest.spyOn(client, 'findParentFolderId').mockReturnValue(Promise.resolve('parentFolderId'));
      jest.spyOn(client, 'findBookFileId').mockReturnValue(Promise.resolve(''));
      // @ts-ignore
      mockDriveClient.files.create = jest.fn(async () => (
        {
          result: {
            id: undefined,
          },
        }
      ));

      await expect(client.initStorage()).rejects.toThrow('Couldnt get bookFile id');
    });
  });

  describe('get', () => {
    beforeEach(() => {
      mockFetch = jest.spyOn(global, 'fetch').mockImplementation(
        jest.fn(() => Promise.resolve({
          arrayBuffer: () => Promise.resolve(rawBook),
        })) as jest.Mock,
      );
      jest.spyOn(client, 'initStorage');
    });

    it('inits storage when no parentFolderId', async () => {
      await client.get();
      expect(client.initStorage).toHaveBeenCalledTimes(1);
    });

    it('returns rawBook from downloaded file', async () => {
      client.parentFolderId = 'parentFolderId';
      client.bookFileId = 'bookFileId';
      const content = await client.get();

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
      expect(content).toEqual(rawBook);
    });
  });

  describe('save', () => {
    beforeEach(() => {
      jest.spyOn(client, 'initStorage');
    });

    it('inits storage when no parentFolderId', async () => {
      await client.save(rawBook);
      expect(client.initStorage).toHaveBeenCalledTimes(1);
    });

    it('saves book as expected', async () => {
      client.parentFolderId = 'parentFolderId';
      client.bookFileId = 'bookFileId';
      await client.save(rawBook);

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

      const blob = mockFetch.mock.calls[0][1]!.body as Blob;
      const blobData = await fileToArrayBuffer(blob);
      expect(new Uint8Array(blobData as ArrayBuffer)).toEqual(rawBook);
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
