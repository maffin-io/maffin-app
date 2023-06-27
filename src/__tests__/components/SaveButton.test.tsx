import React from 'react';
import {
  render,
  screen,
  fireEvent,
} from '@testing-library/react';
import type { DataSource } from 'typeorm';

import type BookStorage from '@/apis/BookStorage';
import SaveButton from '@/components/SaveButton';
import * as dataSourceHooks from '@/hooks/useDataSource';
import * as storageHooks from '@/hooks/useBookStorage';

jest.mock('@/hooks/useDataSource', () => ({
  __esModule: true,
  ...jest.requireActual('@/hooks/useDataSource'),
}));

jest.mock('@/hooks/useBookStorage', () => ({
  __esModule: true,
  ...jest.requireActual('@/hooks/useBookStorage'),
}));

describe('SaveButton', () => {
  it('loads while unavailable datasource', () => {
    const { container } = render(<SaveButton />);
    expect(container).toMatchSnapshot();
  });

  it('loads while unavailable bookstorage', () => {
    jest.spyOn(dataSourceHooks, 'default').mockReturnValue([{} as DataSource]);

    const { container } = render(<SaveButton />);
    expect(container).toMatchSnapshot();
  });

  it('shows Save text when ready', () => {
    jest.spyOn(dataSourceHooks, 'default').mockReturnValue([{} as DataSource]);
    jest.spyOn(storageHooks, 'default').mockReturnValue([{} as BookStorage]);

    const { container } = render(<SaveButton />);

    expect(container).toMatchSnapshot();
  });

  it('exports and saves book', () => {
    const mockExportDatabase = jest.fn().mockReturnValue(
      new Uint8Array([1, 2]),
    ) as typeof DataSource.prototype.sqljsManager.exportDatabase;
    jest.spyOn(dataSourceHooks, 'default').mockReturnValue(
      [
        {
          sqljsManager: {
            exportDatabase: mockExportDatabase,
          },
        } as DataSource,
      ],
    );
    const mockSave = jest.fn() as typeof BookStorage.prototype.save;
    jest.spyOn(storageHooks, 'default').mockReturnValue(
      [
        {
          save: mockSave,
        } as BookStorage,
      ],
    );

    render(<SaveButton />);

    const button = screen.getByText('Save');

    fireEvent.click(button);

    expect(mockExportDatabase).toHaveBeenCalledWith();
    expect(mockSave).toHaveBeenCalledWith(new Uint8Array([1, 2]));
  });
});
