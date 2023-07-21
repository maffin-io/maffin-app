import React from 'react';
import {
  render,
  screen,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import ImportButton from '@/components/buttons/ImportButton';
import type { UseDataSourceReturn } from '@/hooks';
import * as dataSourceHooks from '@/hooks/useDataSource';

jest.mock('@/hooks/useDataSource', () => ({
  __esModule: true,
  ...jest.requireActual('@/hooks/useDataSource'),
}));

describe('ImportButton', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('loads while unavailable datasource', async () => {
    jest.spyOn(dataSourceHooks, 'default').mockReturnValue(
      { isLoaded: false } as UseDataSourceReturn,
    );
    const { container } = render(<ImportButton />);

    const e = await screen.findByRole('menuitem', { name: 'Import' });
    expect(e).toBeDisabled();
    expect(container).toMatchSnapshot();
  });

  it('renders as expected when datasource ready', async () => {
    jest.spyOn(dataSourceHooks, 'default').mockReturnValue(
      { isLoaded: true } as UseDataSourceReturn,
    );
    render(<ImportButton />);

    const e = await screen.findByRole('menuitem', { name: 'Import' });
    expect(e).not.toBeDisabled();
  });

  it('uploads and imports data into datasource', async () => {
    const mockImportBook = jest.fn();
    jest.spyOn(dataSourceHooks, 'default').mockReturnValue(
      {
        isLoaded: true,
        importBook: mockImportBook as Function,
      } as UseDataSourceReturn,
    );
    const file = new File(['hello'], 'hello.png', { type: 'image/png' });
    const user = userEvent.setup();

    render(<ImportButton />);

    const importButton = await screen.findByRole('menuitem', { name: 'Import' });
    await user.click(importButton);

    await userEvent.upload(screen.getByLabelText('importInput'), file);

    expect(mockImportBook).toBeCalledWith(new Uint8Array([104, 101, 108, 108, 111]));
  });
});
