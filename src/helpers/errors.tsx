import React from 'react';
import { toast, ToastOptions } from 'react-hot-toast';
import { BiError, BiX } from 'react-icons/bi';
import Link from 'next/link';

export class MaffinError extends Error {
  code: string;

  constructor(message: string, code: string) {
    super(message);
    this.code = code;
  }

  // eslint-disable-next-line class-methods-use-this
  toUI(): string | React.JSX.Element {
    return this.message;
  }

  show(options?: ToastOptions) {
    toast(
      // @ts-ignore
      (t) => <ToastComponent message={this.toUI()} toastId={t.id} />,
      {
        ...options,
      },
    );
  }
}

export class StorageError extends MaffinError {
  toUI(): string | React.JSX.Element {
    if (this.code === 'UNAUTHORIZED') {
      return (
        <>
          Invalid Google session
          <Link
            href="/user/logout"
            className="ml-1"
          >
            log in again
          </Link>
        </>
      );
    }

    if (this.code === 'OFFLINE') {
      return 'Your changes could not be saved. Check your internet connection';
    }

    if (this.code === 'INVALID_FILE') {
      return 'The selected file is not valid. Make sure you select a file exported from Maffin';
    }

    return super.toUI();
  }
}

export class AuthError extends MaffinError {
  toUI(): string | React.JSX.Element {
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
  message: string | React.JSX.Element,
}): React.JSX.Element {
  return (
    <div className="flex items-center">
      <BiError className="text-red-600 mr-2 text-3xl" />
      {message}
      <button
        onClick={() => toast.dismiss(toastId)}
        className="cursor-pointer"
        aria-label="Close"
        type="button"
      >
        <BiX className="text-lg ml-2" />
      </button>
    </div>
  );
}
