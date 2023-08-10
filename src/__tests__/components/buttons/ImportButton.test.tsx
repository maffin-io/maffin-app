import React from 'react';
import {
  render,
  screen,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import ImportButton from '@/components/buttons/ImportButton';
import { DataSourceContext } from '@/hooks';
import type { DataSourceContextType } from '@/hooks';

describe('ImportButton', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('loads while unavailable datasource', async () => {
    const { container } = render(
      <DataSourceContext.Provider value={{ isLoaded: false } as DataSourceContextType}>
        <ImportButton />
      </DataSourceContext.Provider>,
    );

    const e = await screen.findByRole('menuitem', { name: 'Import' });
    expect(e).toBeDisabled();
    expect(container).toMatchSnapshot();
  });

  it('renders as expected when datasource ready', async () => {
    render(
      <DataSourceContext.Provider value={{ isLoaded: true } as DataSourceContextType}>
        <ImportButton />
      </DataSourceContext.Provider>,
    );

    const e = await screen.findByRole('menuitem', { name: 'Import' });
    expect(e).not.toBeDisabled();
  });

  it('uploads and imports data into datasource', async () => {
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
        <ImportButton />
      </DataSourceContext.Provider>,
    );

    const importButton = await screen.findByRole('menuitem', { name: 'Import' });
    await user.click(importButton);

    await userEvent.upload(screen.getByLabelText('importInput'), file);

    expect(mockImportBook).toBeCalledWith(new Uint8Array([104, 101, 108, 108, 111]));
  });
});
