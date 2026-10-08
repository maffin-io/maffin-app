import React from 'react';
import { render, waitFor } from '@testing-library/react';
import * as navigation from 'next/navigation';
import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import type { UseQueryResult } from '@tanstack/react-query';

import type { DataSourceContextType } from '@/hooks';
import DashboardLayout from '@/app/dashboard/layout';
import DashboardPage from '@/layout/DashboardPage';
import LeftSidebar from '@/layout/LeftSidebar';
import Footer from '@/layout/Footer';
import * as stateHooks from '@/hooks/state';
import * as dataSourceHooks from '@/hooks/useDataSource';
import * as sessionHook from '@/hooks/useSession';

jest.mock('next/navigation');

jest.mock('@/hooks/useSession', () => ({
  __esModule: true,
  ...jest.requireActual('@/hooks/useSession'),
}));

jest.mock('@/hooks/useDataSource', () => ({
  __esModule: true,
  ...jest.requireActual('@/hooks/useDataSource'),
}));

jest.mock('@/layout/LeftSidebar', () => jest.fn(
  () => <div data-testid="LeftSidebar" />,
));

jest.mock('@/layout/Footer', () => jest.fn(
  () => <div data-testid="Footer" />,
));

jest.mock('@/layout/DashboardPage', () => jest.fn(
  () => <div data-testid="DashboardPage" />,
));

jest.mock('react-modal', () => ({
  setAppElement: jest.fn(),
}));

jest.mock('@/hooks/state', () => ({
  __esModule: true,
  ...jest.requireActual('@/hooks/state'),
}));

describe('DashboardLayout', () => {
  let mockRouterPush: jest.Mock;

  beforeEach(() => {
    jest.spyOn(stateHooks, 'useTheme').mockReturnValue(
      { data: undefined } as UseQueryResult<'dark' | 'light'>,
    );
    jest.spyOn(dataSourceHooks, 'default').mockReturnValue(
      { isLoaded: true } as DataSourceContextType,
    );

    mockRouterPush = jest.fn();
    jest.spyOn(navigation, 'useRouter').mockImplementation(() => ({
      push: mockRouterPush as AppRouterInstance['push'],
    } as AppRouterInstance));

    jest.spyOn(sessionHook, 'default').mockReturnValue({
      isAuthenticated: true,
    } as sessionHook.SessionReturn);
  });

  it('sets localstorage theme', async () => {
    localStorage.setItem('theme', 'light');
    render(
      <DashboardLayout>
        <span data-testid="child">child</span>
      </DashboardLayout>,
    );
    const html = document.documentElement;

    await waitFor(() => expect(html.classList).toHaveLength(0));
  });

  it('renders as expected when datasource available', async () => {
    const children = <span data-testid="child">child</span>;
    const { container } = render(
      <DashboardLayout>
        {children}
      </DashboardLayout>,
    );

    await waitFor(() => expect(DashboardPage).toHaveBeenLastCalledWith({ children }, undefined));
    expect(LeftSidebar).toHaveBeenLastCalledWith({}, undefined);
    expect(Footer).toHaveBeenLastCalledWith({}, undefined);
    expect(container).toMatchSnapshot();
  });

  it('redirects to /user/login if not authenticated and has loaded', async () => {
    jest.spyOn(sessionHook, 'default').mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
    } as sessionHook.SessionReturn);

    render(
      <DashboardLayout>
        <span data-testid="child">child</span>
      </DashboardLayout>,
    );

    await waitFor(() => expect(mockRouterPush).toBeCalledWith('/user/login'));
  });
});
