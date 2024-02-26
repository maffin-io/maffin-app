import pako from 'pako';

import BookStorage from '@/lib/storage/BookStorage';

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
      const response = await this.driveClient.files.create({
        fields: 'id',
        resource: {
          name: 'maffin.io',
          mimeType: 'application/vnd.google-apps.folder',
        },
      });
      if (response.result.id === undefined) {
        throw new Error('Couldnt get parent folder id');
      }
      this.parentFolderId = response.result.id;
    }

    this.bookFileId = await this.findBookFileId('book1');
    if (!this.bookFileId) {
      const response = await this.driveClient.files.create({
        fields: 'id',
        resource: {
          name: 'book1.sqlite.gz',
          mimeType: 'application/vnd.sqlite3',
          parents: [this.parentFolderId],
        },
      });

      if (response.result.id === undefined) {
        throw new Error('Couldnt get bookFile id');
      }
      this.bookFileId = response.result.id;
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
    await fetch(
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
    const response = await this.driveClient.files.list({
      q: `mimeType = 'application/vnd.google-apps.folder' and name='${app}' and trashed = false`,
    });

    return response.result.files?.[0]?.id || '';
  }

  /**
   * Tries to find a file called {book}.sqlite inside the parent folder. The file must be
   * owned by the app as the scope is only to access its own files. If not
   * found it returns empty string
   */
  private async findBookFileId(book: string): Promise<string> {
    if (this.parentFolderId === '') {
      throw new Error('Parent folder id is not set');
    }

    const response = await this.driveClient.files.list({
      q: `name='${book}.sqlite.gz' and trashed = false and '${this.parentFolderId}' in parents`,
    });

    return response.result.files?.[0]?.id || '';
  }
}
