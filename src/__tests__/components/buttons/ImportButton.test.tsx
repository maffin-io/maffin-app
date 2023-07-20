import React from 'react';
import {
  render,
  screen,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DataSource } from 'typeorm';
import crypto from 'crypto';
import * as swr from 'swr';

import ImportButton from '@/components/buttons/ImportButton';
import * as storageHooks from '@/hooks/useBookStorage';
import * as dataSourceHooks from '@/hooks/useDataSource';
import type BookStorage from '@/apis/BookStorage';

jest.mock('swr');

jest.mock('@/hooks/useBookStorage', () => ({
  __esModule: true,
  ...jest.requireActual('@/hooks/useBookStorage'),
}));

jest.mock('@/hooks/useDataSource', () => ({
  __esModule: true,
  ...jest.requireActual('@/hooks/useDataSource'),
}));

const mockInitialize = jest.fn();
const mockExportDatabase = jest.fn();
const mockDestroy = jest.fn();
jest.mock('typeorm', () => ({
  __esModule: true,
  ...jest.requireActual('typeorm'),
  DataSource: jest.fn().mockImplementation(() => ({
    initialize: async () => mockInitialize(),
    destroy: async () => mockDestroy(),
    sqljsManager: {
      exportDatabase: () => mockExportDatabase(),
    },
  })),
}));

Object.defineProperty(global.self, 'crypto', {
  value: {
    randomUUID: () => crypto.randomUUID(),
  },
});

describe('ImportButton', () => {
  let mockLoadDatabase: jest.Mock;
  let mockSave: jest.Mock<typeof BookStorage.prototype.save>;

  beforeEach(() => {
    mockSave = jest.fn();
    jest.spyOn(storageHooks, 'default').mockReturnValue([{
      save: mockSave as Function,
    } as BookStorage]);

    mockLoadDatabase = jest.fn();
    jest.spyOn(dataSourceHooks, 'default').mockReturnValue([{
      sqljsManager: {
        loadDatabase: mockLoadDatabase as Function,
      },
    } as DataSource]);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders as expected when storage available', async () => {
    const { container } = render(<ImportButton />);

    await screen.findByRole('menuitem', { name: 'Import' });
    expect(container).toMatchSnapshot();
  });

  it('disables button if storage not available', async () => {
    jest.spyOn(storageHooks, 'default').mockReturnValue([null]);
    render(<ImportButton />);

    expect(screen.queryByRole('menuitem', { name: 'Import' })).toBeDisabled();
  });

  it('uploads file on click', async () => {
    mockExportDatabase.mockReturnValue(new Uint8Array([104, 101, 108, 108, 111]));
    const file = new File(['hello'], 'hello.png', { type: 'image/png' });
    const user = userEvent.setup();

    render(<ImportButton />);

    const importButton = await screen.findByRole('menuitem', { name: 'Import' });
    await user.click(importButton);

    await userEvent.upload(screen.getByLabelText('importInput'), file);

    expect(mockSave).toBeCalledWith(new Uint8Array([104, 101, 108, 108, 111]));
  });

  it('refreshes main datasource on upload', async () => {
    mockExportDatabase.mockReturnValue(new Uint8Array([22, 33]));
    const file = new File(['hello'], 'hello.png', { type: 'image/png' });
    const user = userEvent.setup();

    render(<ImportButton />);

    const importButton = await screen.findByRole('menuitem', { name: 'Import' });
    await user.click(importButton);

    await userEvent.upload(screen.getByLabelText('importInput'), file);

    expect(mockInitialize).toBeCalledTimes(1);
    expect(mockInitialize).toBeCalledWith();
    expect(mockExportDatabase).toBeCalledTimes(1);
    expect(mockExportDatabase).toBeCalledWith();
    expect(mockLoadDatabase).toBeCalledTimes(1);
    expect(mockLoadDatabase).toBeCalledWith(new Uint8Array([22, 33]));

    // WARNING: This ensures that the temp datasource is not destroyed
    // after loading the data into the main one. Apparently calling destroy
    // also disconnects the main one which is probably a bug in typeorm?
    expect(mockDestroy).not.toBeCalled();

    expect(swr.mutate).toBeCalledTimes(1);
    expect(swr.mutate).toBeCalledWith(expect.any(Function));
  });
});
