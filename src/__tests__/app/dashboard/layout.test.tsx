import React from 'react';
import { render, screen } from '@testing-library/react';
import type { DataSource } from 'typeorm';

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

describe('DashboardLayout', () => {
  beforeEach(() => {
    jest.spyOn(userHooks, 'default').mockReturnValue({
      user: {
        name: '',
        email: '',
        image: '',
        isLoggedIn: false,
      },
      mutate: jest.fn(),
    });
    jest.spyOn(dataSourceHooks, 'default').mockReturnValue([{} as DataSource]);
  });

  it('returns loading when no user available', async () => {
    const { container } = render(
      <DashboardLayout>
        <span data-testid="child">child</span>
      </DashboardLayout>,
    );

    expect(screen.queryByTestId('child')).not.toBeInTheDocument();
    expect(Topbar).toBeCalledTimes(0);
    expect(LeftSidebar).toBeCalledTimes(0);
    expect(Footer).toBeCalledTimes(0);
    expect(container).toMatchSnapshot();
  });

  it('returns loading when datasource not available', async () => {
    jest.spyOn(dataSourceHooks, 'default').mockReturnValue([null]);
    jest.spyOn(userHooks, 'default').mockReturnValue({
      user: {
        name: 'name',
        email: 'email',
        image: 'image',
        isLoggedIn: true,
      },
      mutate: jest.fn(),
    });
    const { container } = render(
      <DashboardLayout>
        <span data-testid="child">child</span>
      </DashboardLayout>,
    );

    expect(screen.queryByTestId('child')).not.toBeInTheDocument();
    expect(Topbar).toBeCalledTimes(0);
    expect(LeftSidebar).toBeCalledTimes(0);
    expect(Footer).toBeCalledTimes(0);
    expect(container).toMatchSnapshot();
  });

  it('renders as expected when user and datasource available', async () => {
    jest.spyOn(userHooks, 'default').mockReturnValue({
      user: {
        name: 'name',
        email: 'email',
        image: 'image',
        isLoggedIn: true,
      },
      mutate: jest.fn(),
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
