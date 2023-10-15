import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import * as swr from 'swr';

import type { DataSourceContextType } from '@/hooks';
import DashboardLayout from '@/app/dashboard/layout';
import Topbar from '@/layout/Topbar';
import LeftSidebar from '@/layout/LeftSidebar';
import Footer from '@/layout/Footer';
import * as userHooks from '@/hooks/useUser';
import * as dataSourceHooks from '@/hooks/useDataSource';

jest.mock('@/hooks/useUser', () => ({
  __esModule: true,
  ...jest.requireActual('@/hooks/useUser'),
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

jest.mock('@/layout/Topbar', () => jest.fn(
  () => <div data-testid="Topbar" />,
));

jest.mock('react-modal', () => ({
  setAppElement: jest.fn(),
}));

describe('DashboardLayout', () => {
  beforeEach(() => {
    swr.mutate('/state/theme', undefined);
    jest.spyOn(userHooks, 'default').mockReturnValue({
      user: {
        name: '',
        email: '',
        image: '',
        isLoggedIn: false,
      },
    });
    jest.spyOn(dataSourceHooks, 'default').mockReturnValue(
      { isLoaded: true } as DataSourceContextType,
    );
  });

  it('returns loading when no user available', async () => {
    const { container } = render(
      <DashboardLayout>
        <span data-testid="child">child</span>
      </DashboardLayout>,
    );

    const html = document.documentElement;
    await waitFor(() => expect(html).toHaveClass('dark'));

    expect(screen.queryByTestId('child')).not.toBeInTheDocument();
    expect(Topbar).toBeCalledTimes(0);
    expect(LeftSidebar).toBeCalledTimes(0);
    expect(Footer).toBeCalledTimes(0);
    expect(container).toMatchSnapshot();
  });

  it('returns loading when datasource not available', async () => {
    jest.spyOn(dataSourceHooks, 'default').mockReturnValue(
      { isLoaded: false } as DataSourceContextType,
    );
    jest.spyOn(userHooks, 'default').mockReturnValue({
      user: {
        name: 'name',
        email: 'email',
        image: 'image',
        isLoggedIn: true,
      },
    });
    const { container } = render(
      <DashboardLayout>
        <span data-testid="child">child</span>
      </DashboardLayout>,
    );

    const html = document.documentElement;
    await waitFor(() => expect(html).toHaveClass('dark'));

    expect(screen.queryByTestId('child')).not.toBeInTheDocument();
    expect(Topbar).toBeCalledTimes(0);
    expect(LeftSidebar).toBeCalledTimes(0);
    expect(Footer).toBeCalledTimes(0);
    expect(container).toMatchSnapshot();
  });

  it('sets system theme', async () => {
    render(
      <DashboardLayout>
        <span data-testid="child">child</span>
      </DashboardLayout>,
    );
    const html = document.documentElement;

    await waitFor(() => expect(html).toHaveClass('dark'));
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

  it('renders as expected when user and datasource available', async () => {
    jest.spyOn(userHooks, 'default').mockReturnValue({
      user: {
        name: 'name',
        email: 'email',
        image: 'image',
        isLoggedIn: true,
      },
    });

    const { container } = render(
      <DashboardLayout>
        <span data-testid="child">child</span>
      </DashboardLayout>,
    );

    await screen.findByTestId('child');
    expect(Topbar).toHaveBeenLastCalledWith({}, {});
    expect(LeftSidebar).toHaveBeenLastCalledWith({}, {});
    expect(Footer).toHaveBeenLastCalledWith({}, {});
    expect(container).toMatchSnapshot();
  });
});
