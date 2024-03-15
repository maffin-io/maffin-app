import React from 'react';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import type { DataSource } from 'typeorm';
import type { SqljsEntityManager } from 'typeorm/entity-manager/SqljsEntityManager';

import ExportButton from '@/components/buttons/ExportButton';
import { DataSourceContext } from '@/hooks';
import type { DataSourceContextType } from '@/hooks';

describe('ExportButton', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('is disabled when datasource not loaded', async () => {
    render(
      <DataSourceContext.Provider value={{ isLoaded: false } as DataSourceContextType}>
        <ExportButton />
      </DataSourceContext.Provider>,
    );

    const e = await screen.findByRole('button', { name: 'Export' });
    expect(e).toBeDisabled();
  });

  it('renders as expected', async () => {
    const { container } = render(
      <DataSourceContext.Provider value={{ isLoaded: true } as DataSourceContextType}>
        <ExportButton />
      </DataSourceContext.Provider>,
    );

    const e = await screen.findByRole('button', { name: 'Export' });
    expect(e).not.toBeDisabled();
    expect(container).toMatchSnapshot();
  });

  it('exports data from datasource', async () => {
    (window.URL.createObjectURL as jest.Mock).mockReturnValue('blob:url');
    const mockDatasource = {
      sqljsManager: {
        exportDatabase: jest.fn().mockReturnValue(new Uint8Array([22, 33])) as SqljsEntityManager['exportDatabase'],
      },
    } as DataSource;

    render(
      <DataSourceContext.Provider
        value={{
          isLoaded: true,
          datasource: mockDatasource,
        } as DataSourceContextType}
      >
        <ExportButton />
      </DataSourceContext.Provider>,
    );

    // https://github.com/jsdom/jsdom/issues/2112#issuecomment-926601210
    const hiddenLink = screen.getByRole('link');
    const mockClick = jest.fn();
    hiddenLink.addEventListener(
      'click',
      (e) => {
        e.preventDefault();
        mockClick();
      },
    );

    const button = await screen.findByRole('button', { name: 'Export' });
    await userEvent.click(button);

    expect(hiddenLink).toHaveAttribute('href', 'blob:url');
    expect(mockClick).toBeCalled();

    expect(window.URL.createObjectURL).toBeCalledWith(
      new Blob([new Uint8Array([22, 33])], { type: 'application/vnd.sqlite3' }),
    );
  });
});
