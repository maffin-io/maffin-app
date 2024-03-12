import React from 'react';
import { toast, ToastOptions } from 'react-hot-toast';
import { BiError, BiX } from 'react-icons/bi';

export class MaffinError extends Error {
  code: string;

  constructor(message: string, code: string) {
    super(message);
    this.code = code;
  }

  // eslint-disable-next-line class-methods-use-this
  toUI(): string {
    return 'Unknown error';
  }

  show(options?: ToastOptions) {
    toast(
      (t) => <ToastComponent message={this.toUI()} toastId={t.id} />,
      {
        duration: Infinity,
        ...options,
      },
    );
  }
}

export class StorageError extends MaffinError {
  toUI(): string {
    if (this.code === 'UNAUTHORIZED') {
      return 'Invalid Google session, please log in again';
    }

    if (this.code === 'OFFLINE') {
      return 'Your changes could not be saved. Check your internet connection';
    }

    return super.toUI();
  }
}

export class AuthError extends MaffinError {
  toUI(): string {
    if (this.code === 'INVALID_SUBSCRIPTION') {
      return 'You need a valid subscription';
    }

    return super.toUI();
  }
}

function ToastComponent({
  toastId,
  message,
}: {
  toastId: string,
  message: string,
}): JSX.Element {
  return (
    <div className="flex items-center">
      <BiError className="text-red-600 mr-2 text-3xl" />
      {message}
      <button
        onClick={() => toast.dismiss(toastId)}
        className="cursor-pointer"
        type="button"
      >
        <BiX className="text-lg ml-2" />
      </button>
    </div>
  );
}
