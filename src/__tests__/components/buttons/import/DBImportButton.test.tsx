import React from 'react';
import {
  render,
  screen,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import ImportButton from '@/components/buttons/import/DBImportButton';
import { DataSourceContext } from '@/hooks';
import type { DataSourceContextType } from '@/hooks';

describe('DBImportButton', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('disables button when datasource not available', async () => {
    const { container } = render(
      <DataSourceContext.Provider value={{ isLoaded: false } as DataSourceContextType}>
        <ImportButton />
      </DataSourceContext.Provider>,
    );

    const e = await screen.findByRole('button');
    expect(e).toBeDisabled();
    expect(container).toMatchSnapshot();
  });

  it('renders as expected when datasource ready', async () => {
    render(
      <DataSourceContext.Provider value={{ isLoaded: true } as DataSourceContextType}>
        <ImportButton />
      </DataSourceContext.Provider>,
    );

    const e = await screen.findByRole('button');
    expect(e).not.toBeDisabled();
  });

  it('uploads and imports data into datasource', async () => {
    const mockOnImport = jest.fn();
    const mockImportBook = jest.fn();
    const file = new File(['hello'], 'hello.png', { type: 'image/png' });
    const user = userEvent.setup();

    render(
      <DataSourceContext.Provider
        value={{
          isLoaded: true,
          importBook: mockImportBook as Function,
        } as DataSourceContextType}
      >
        <ImportButton onImport={mockOnImport} />
      </DataSourceContext.Provider>,
    );

    const importButton = await screen.findByRole('button');
    await user.click(importButton);

    await userEvent.upload(screen.getByLabelText('importInput'), file);

    expect(mockImportBook).toBeCalledWith(new Uint8Array([104, 101, 108, 108, 111]));
    expect(mockOnImport).toBeCalled();
  });
});
