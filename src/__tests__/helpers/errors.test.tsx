import * as toast from 'react-hot-toast';
import { render } from '@testing-library/react';

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
    it('returns unknown', () => {
      expect(error.toUI()).toEqual('Unknown error');
    });
  });

  describe('show', () => {
    it('shows toast', () => {
      jest.spyOn(toast, 'toast');
      error.show();

      expect(toast.toast).toBeCalledWith(expect.any(Function), { duration: Infinity });
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
    it('returns unauthorized error', () => {
      const error = new StorageError('message', 'UNAUTHORIZED');

      expect(error.toUI()).toEqual('Invalid Google session, please log in again');
    });

    it('returns offline error', () => {
      const error = new StorageError('message', 'OFFLINE');

      expect(error.toUI()).toEqual('Your changes could not be saved. Check your internet connection');
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
