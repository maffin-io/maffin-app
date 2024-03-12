import pako from 'pako';

import BookStorage from '@/lib/storage/BookStorage';
import { StorageError } from '@/helpers/errors';

export default class GDriveBookStorage implements BookStorage {
  private gapiClient: typeof gapi.client;
  private driveClient: typeof gapi.client.drive;
  private parentFolderId: string;
  private bookFileId: string;

  constructor(client: typeof gapi.client) {
    // Apparently there is no use to upload content using gapi.drive client
    // https://github.com/google/google-api-javascript-client/issues/672
    this.gapiClient = client;
    this.driveClient = client.drive;
    this.parentFolderId = '';
    this.bookFileId = '';
  }

  /**
   * Initializes Gooogle Drive storage by:
   * - Creating a folder called 'maffin.io' if it doesn't exist
   * - Creating an empty file called 'book1.sqlite.gz' within if it doesn't exist.
   */
  async initStorage(): Promise<void> {
    this.parentFolderId = await this.findParentFolderId();
    if (!this.parentFolderId) {
      try {
        const response = await this.driveClient.files.create({
          fields: 'id',
          resource: {
            name: 'maffin.io',
            mimeType: 'application/vnd.google-apps.folder',
          },
        });
        this.parentFolderId = response.result.id as string;
      } catch (e) {
        throwFromStatus((e as gapi.client.Response<gapi.client.drive.File>).status);
        throw e;
      }
    }

    this.bookFileId = await this.findBookFileId('book1');
    if (!this.bookFileId) {
      try {
        const response = await this.driveClient.files.create({
          fields: 'id',
          resource: {
            name: 'book1.sqlite.gz',
            mimeType: 'application/vnd.sqlite3',
            parents: [this.parentFolderId],
          },
        });
        this.bookFileId = response.result.id as string;
      } catch (e) {
        throwFromStatus((e as gapi.client.Response<gapi.client.drive.File>).status);
        throw e;
      }
    }
  }

  /**
   * Retrieves the book stored in Google Drive. The function
   * uses fetch because gapi drive doesnt deal correctly with binary content
   * and returns it as a string instead.
   */
  async get(): Promise<Uint8Array> {
    const start = performance.now();
    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files/${this.bookFileId}?alt=media`,
      {
        method: 'GET',
        headers: new Headers({
          Authorization: `Bearer ${this.gapiClient.getToken().access_token}`,
          'Content-Type': 'application/vnd.sqlite3',
        }),
      },
    );
    const binaryContent = await response.arrayBuffer();

    const data = pako.ungzip(binaryContent) || new Uint8Array();
    const end = performance.now();
    console.log(`get book: ${end - start}ms`);
    return data;
  }

  /**
   * Updates the book stored in Google drive with the
   * contents of rawBook.
   *
   * For uploading binary content, we are using fetch
   * instead of gapi due to some issues with the library uploading binary
   * content. See: https://stackoverflow.com/questions/68698612
   *
   * @param rawBook - The RawBook to be uploaded
   */
  async save(rawBook: Uint8Array): Promise<void> {
    const start = performance.now();

    let response: Response | undefined;
    try {
      response = await fetch(
        `https://www.googleapis.com/upload/drive/v3/files/${this.bookFileId}`,
        {
          method: 'PATCH',
          headers: new Headers({
            Authorization: `Bearer ${this.gapiClient.getToken().access_token}`,
            'Content-Type': 'application/vnd.sqlite3',
          }),
          body: new Blob([pako.gzip(rawBook, { level: 9 })], { type: 'application/vnd.sqlite3' }),
        },
      );
    } catch (e) {
      throwFromStatus(500);
    }

    throwFromStatus(response?.status || 500);

    const end = performance.now();
    console.log(`save book: ${end - start}`);
  }

  /**
   * Tries to find a folder in your google drive with the name 'maffin.io'. The folder must
   * be owned by the app as the scope is only to access its own files. If not found it returns
   * empty string
   */
  private async findParentFolderId(): Promise<string> {
    const app = 'maffin.io';
    try {
      const response = await this.driveClient.files.list({
        q: `mimeType = 'application/vnd.google-apps.folder' and name='${app}' and trashed = false`,
      });
      return response.result.files?.[0]?.id || '';
    } catch (e) {
      throwFromStatus((e as gapi.client.Response<gapi.client.drive.FileList>).status);
      throw e;
    }
  }

  /**
   * Tries to find a file called {book}.sqlite inside the parent folder. The file must be
   * owned by the app as the scope is only to access its own files. If not
   * found it returns empty string
   */
  private async findBookFileId(book: string): Promise<string> {
    try {
      const response = await this.driveClient.files.list({
        q: `name='${book}.sqlite.gz' and trashed = false and '${this.parentFolderId}' in parents`,
      });
      return response.result.files?.[0]?.id || '';
    } catch (e) {
      throwFromStatus((e as gapi.client.Response<gapi.client.drive.FileList>).status);
      throw e;
    }
  }
}

function throwFromStatus(status: number | undefined, message?: string) {
  if (status === 401) {
    throw new StorageError('Invalid token', 'UNAUTHORIZED');
  }

  if (status === 500) {
    throw new StorageError('Failed to fetch', 'OFFLINE');
  }

  if (status && status > 400) {
    throw new StorageError(message || 'Unknown error', 'UNKNOWN');
  }
}
