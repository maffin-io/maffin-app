import React from 'react';
import * as toast from 'react-hot-toast';
import { render } from '@testing-library/react';
import Link from 'next/link';

import { AuthError, MaffinError, StorageError } from '@/helpers/errors';

jest.mock('react-hot-toast', () => ({
  __esModule: true,
  ...jest.requireActual('react-hot-toast'),
}));

describe('MaffinError', () => {
  let error: MaffinError;
  beforeEach(() => {
    error = new MaffinError('message', 'code');
  });

  it('assigns code', () => {
    expect(error.message).toEqual('message');
    expect(error.code).toEqual('code');
  });

  describe('toUI', () => {
    it('returns message when unknown', () => {
      expect(error.toUI()).toEqual('message');
    });
  });

  describe('show', () => {
    it('shows toast', () => {
      jest.spyOn(toast, 'toast');
      error.show();

      expect(toast.toast).toBeCalledWith(expect.any(Function), {});
      // @ts-ignore
      const fn = (toast.toast as jest.Mock).mock.calls[0][0];

      const { container } = render(fn({ t: 'id' }));
      expect(container).toMatchSnapshot();
    });
  });
});

describe('StorageError', () => {
  it('is instance of MaffinError', () => {
    const error = new StorageError('message', 'UNAUTHORIZED');

    expect(error).toBeInstanceOf(MaffinError);
  });

  describe('toUI', () => {
    it.each([
      [
        'UNAUTHORIZED',
        (
          <>
            Invalid Google session
            <Link
              href="/user/logout"
              className="ml-1"
            >
              log in again
            </Link>
          </>
        ),
      ],
      ['OFFLINE', 'Your changes could not be saved. Check your internet connection'],
      ['INVALID_FILE', 'The selected file is not valid. Make sure you select a file exported from Maffin'],
    ])('shows message for %s', (code, expected) => {
      const error = new StorageError('message', code);

      expect(error.toUI()).toEqual(expected);
    });

    it('calls super when unknown', () => {
      jest.spyOn(MaffinError.prototype, 'toUI');
      const error = new StorageError('message', 'UNKNOWN');

      error.toUI();
      expect(MaffinError.prototype.toUI).toBeCalledWith();
    });
  });
});

describe('AuthError', () => {
  it('is instance of MaffinError', () => {
    const error = new AuthError('message', 'UNAUTHORIZED');

    expect(error).toBeInstanceOf(MaffinError);
  });

  describe('toUI', () => {
    it('returns invalid subscription error', () => {
      const error = new AuthError('message', 'INVALID_SUBSCRIPTION');

      expect(error.toUI()).toEqual('You need a valid subscription');
    });

    it('calls super when unknown', () => {
      jest.spyOn(MaffinError.prototype, 'toUI');
      const error = new AuthError('message', 'UNKNOWN');

      error.toUI();
      expect(MaffinError.prototype.toUI).toBeCalledWith();
    });
  });
});
