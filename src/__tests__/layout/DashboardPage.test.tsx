import React from 'react';
import { render, screen } from '@testing-library/react';

import Topbar from '@/layout/Topbar';
import * as dataSourceHook from '@/hooks/useDataSource';
import type { DataSourceContextType } from '@/hooks';
import DashboardPage from '@/layout/DashboardPage';

jest.mock('@/hooks/useDataSource', () => ({
  __esModule: true,
  ...jest.requireActual('@/hooks/useDataSource'),
}));

jest.mock('@/components/Loading', () => jest.fn(
  () => <div data-testid="Loading" />,
));

jest.mock('@/layout/Topbar', () => jest.fn(
  () => <div data-testid="Topbar" />,
));

describe('DashboardPage', () => {
  beforeEach(() => {
    jest.spyOn(dataSourceHook, 'default').mockReturnValue(
      { isLoaded: false } as DataSourceContextType,
    );
  });

  it('returns loading when datasource not available', async () => {
    render(
      <DashboardPage>
        <span data-testid="child">child</span>
      </DashboardPage>,
    );

    screen.getByTestId('Loading');
    expect(screen.queryByTestId('child')).not.toBeInTheDocument();
    expect(Topbar).toBeCalledTimes(0);
  });

  it('renders as expected when datasource available', async () => {
    jest.spyOn(dataSourceHook, 'default').mockReturnValue(
      { isLoaded: true } as DataSourceContextType,
    );

    render(
      <DashboardPage>
        <span data-testid="child">child</span>
      </DashboardPage>,
    );

    await screen.findByTestId('child');
    expect(Topbar).toHaveBeenLastCalledWith({}, undefined);
  });
});
